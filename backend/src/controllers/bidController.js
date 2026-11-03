const prisma = require('../prismaClient');
const { invalidateItemCache } = require('./itemController');
const { isAuctionEndedBackend } = require('../utils/dateHelper');
const { settleExpiredAuctions } = require('../utils/settlement');

const BID_FEE = 1.00;

const createBidRecord = async (tx, { itemId, userId, amount, transactionId, io }) => {
  const item = await tx.item.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');
  if (item.status !== 'active' || isAuctionEndedBackend(item.end_time)) throw new Error('Auction is not active or has ended');

  const parsedAmount = parseFloat(parseFloat(amount).toFixed(2));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Bid amount must be at least 0.01 Birr (cannot be negative or zero)');
  }

  const existingBids = await tx.bid.findMany({
    where: { item_id: itemId, amount: parsedAmount }
  });

  let is_unique = true;
  let duplicatedUsers = [];

  if (existingBids.length > 0) {
    is_unique = false;
    const uniqueExisting = existingBids.filter((bid) => bid.is_unique);
    if (uniqueExisting.length > 0) {
      await tx.bid.updateMany({
        where: { id: { in: uniqueExisting.map((bid) => bid.id) } },
        data: { is_unique: false }
      });
      duplicatedUsers = uniqueExisting.map((bid) => bid.user_id).filter((id) => id !== userId);
    }
  }

  const newBid = await tx.bid.create({
    data: {
      amount: parsedAmount,
      is_unique,
      item_id: itemId,
      user_id: userId,
      transaction_id: transactionId || null
    },
    include: {
      user: {
        select: { id: true, name: true, phone_number: true, image_url: true }
      }
    }
  });

  const total_bids = await tx.bid.count({ where: { item_id: itemId } });

  for (const duplicatedUserId of duplicatedUsers) {
    const message = `Your bid of ${parsedAmount} ETB for item "${item.title}" has been duplicated. Place a new unique bid to stay in the lead!`;
    await tx.notification.create({
      data: { user_id: duplicatedUserId, message, notification_type: 'bid' }
    });
    if (io && typeof io.to === 'function') {
      io.to(`user_${duplicatedUserId}`).emit('bid_duplicated', {
        item_id: itemId,
        amount: parsedAmount,
        message
      });
    }
  }

  return { ...newBid, total_bids };
};

exports.createBidRecord = createBidRecord;

exports.placeBid = async (req, res) => {
  const { item_id, amount, payment_method, phone_number } = req.body;
  const user_id = req.user.id;
  const io = req.io;

  try {
    if (payment_method && payment_method !== 'wallet') {
      throw new Error('Online payments must be completed through Chapa checkout.');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check item status and bid amount
      const item = await tx.item.findUnique({ where: { id: item_id } });
      if (!item) throw new Error('Item not found');
      if (item.status !== 'active' || isAuctionEndedBackend(item.end_time)) throw new Error('Auction is not active or has ended');

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Bid amount must be at least 0.01 Birr');
      }

      // Participation / service fee is item.base_price (or 1.00 if unset)
      const bidFee = item.base_price != null ? item.base_price : 1.00;

      // 2. Check user wallet
      const user = await tx.user.findUnique({ where: { id: user_id } });
      if (!user) throw new Error('User not found');

      if (!payment_method || payment_method === 'wallet') {
        if (user.wallet_balance < bidFee) {
          throw new Error(`Insufficient wallet balance. Participation fee is ${bidFee.toFixed(2)} Birr.`);
        }
        await tx.user.update({
          where: { id: user_id },
          data: { wallet_balance: user.wallet_balance - bidFee }
        });
      }

      // Requirement 1: paid phone - if changed take it, else default (registered phone number)
      const phoneInput = phone_number || user.phone_number || '';
      let rawPhone = String(phoneInput).replace(/\D/g, '');
      if (rawPhone.startsWith('251')) rawPhone = '0' + rawPhone.slice(3);
      if (!rawPhone.startsWith('0') && (rawPhone.startsWith('9') || rawPhone.startsWith('7'))) rawPhone = '0' + rawPhone;
      const finalPaidPhone = rawPhone || user.phone_number || null;

      // Requirement 2: payment_method -> 'wallet'
      // Requirement 3: payment_type -> 'bid_purchase'
      const txRef = `tinish-wallet-bid-${user_id}-${item_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const walletTx = await tx.transaction.create({
        data: {
          tx_ref: txRef,
          amount: bidFee,
          bid_amount: parsedAmount,
          status: 'completed',
          payment_method: 'wallet',
          payment_type: 'bid_purchase',
          paid_phone: finalPaidPhone,
          user_id: user_id
        }
      });

      // 3. Create the bid linked to this transaction
      return createBidRecord(tx, {
        itemId: item_id,
        userId: user_id,
        amount: parsedAmount,
        transactionId: walletTx.id,
        io
      });
    });

    // Invalidate cache so live auction details and item lists are up to date
    invalidateItemCache(item_id);

    // Broadcast global update
    io.emit('bid_update', {
      item_id: Number(item_id),
      new_bid_amount: result.amount,
      is_unique: result.is_unique,
      total_bids: result.total_bids,
      bid: result
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserBids = async (req, res) => {
  try {
    const user_id = req.user.id;
    await settleExpiredAuctions(req.io);
    const userBids = await prisma.bid.findMany({
      where: { user_id },
      include: {
        item: {
          include: {
            winner: {
              select: { id: true, name: true, phone_number: true }
            },
            bids: {
              select: { id: true, amount: true, user_id: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const now = new Date();

    const formattedBids = userBids.map((b) => {
      const item = b.item;
      if (!item) return b;

      const isEnded = item.status === 'ended' || item.status === 'closed' || isAuctionEndedBackend(item.end_time);
      let calculatedWinnerId = item.winner_id || (item.winner?.id ?? null);

      if (!calculatedWinnerId && isEnded && item.bids && item.bids.length > 0) {
        const isLUB = item.pool_type === 'lub' || item.is_lub || item.pool_type === 'premium';

        if (isLUB) {
          const amountMap = {};
          item.bids.forEach((bidItem) => {
            const amtKey = parseFloat(bidItem.amount || 0).toFixed(2);
            if (!amountMap[amtKey]) amountMap[amtKey] = [];
            amountMap[amtKey].push(bidItem);
          });
          const uniqueKeys = Object.keys(amountMap).filter((k) => amountMap[k].length === 1);
          if (uniqueKeys.length > 0) {
            uniqueKeys.sort((x, y) => parseFloat(x) - parseFloat(y));
            calculatedWinnerId = amountMap[uniqueKeys[0]][0].user_id;
          }
        } else {
          const sorted = [...item.bids].sort((x, y) => parseFloat(y.amount) - parseFloat(x.amount));
          calculatedWinnerId = sorted[0].user_id;
        }
      }

      return {
        ...b,
        item: {
          ...item,
          winner_id: calculatedWinnerId
        }
      };
    });

    res.json(formattedBids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

