const prisma = require('../prismaClient');
const { invalidateItemCache } = require('./itemController');

const BID_FEE = 1.00;

const createBidRecord = async (tx, { itemId, userId, amount, io }) => {
  const item = await tx.item.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');
  if (item.status !== 'active') throw new Error('Auction is not active');

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Bid amount must be at least 0.01 Birr');
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
    data: { amount: parsedAmount, is_unique, item_id: itemId, user_id: userId }
  });

  for (const duplicatedUserId of duplicatedUsers) {
    const message = `Your bid of ${parsedAmount} ETB for item "${item.title}" has been duplicated. Place a new unique bid to stay in the lead!`;
    await tx.notification.create({
      data: { user_id: duplicatedUserId, message }
    });
    if (io && typeof io.to === 'function') {
      io.to(`user_${duplicatedUserId}`).emit('bid_duplicated', {
        item_id: itemId,
        amount: parsedAmount,
        message
      });
    }
  }

  return newBid;
};

exports.createBidRecord = createBidRecord;

exports.placeBid = async (req, res) => {
  const { item_id, amount, payment_method } = req.body;
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
      if (item.status !== 'active') throw new Error('Auction is not active');

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

      // 3. Create the bid after the selected fee source is authorized.
      return createBidRecord(tx, { itemId: item_id, userId: user_id, amount: parsedAmount, io });
    });

    // Invalidate cache so live auction details and item lists are up to date
    invalidateItemCache(item_id);

    // Broadcast global update
    io.emit('bid_update', {
      item_id,
      new_bid_amount: result.amount,
      is_unique: result.is_unique
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserBids = async (req, res) => {
  try {
    const user_id = req.user.id;
    const userBids = await prisma.bid.findMany({
      where: { user_id },
      include: {
        item: {
          include: {
            bids: {
              select: { amount: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(userBids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
