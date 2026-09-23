const prisma = require('../prismaClient');

const BID_FEE = 1.00;

exports.placeBid = async (req, res) => {
  const { item_id, amount } = req.body;
  const user_id = req.user.id;
  const io = req.io;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check item status
      const item = await tx.item.findUnique({ where: { id: item_id } });
      if (!item) throw new Error('Item not found');
      if (item.status !== 'active') throw new Error('Auction is not active');
      if (amount <= item.base_price) throw new Error('Bid must be higher than base price');

      // 2. Check user wallet
      const user = await tx.user.findUnique({ where: { id: user_id } });
      if (user.wallet_balance < BID_FEE) throw new Error('Insufficient wallet balance');

      // 3. Deduct fee
      await tx.user.update({
        where: { id: user_id },
        data: { wallet_balance: user.wallet_balance - BID_FEE }
      });

      // 4. Check uniqueness
      const existingBids = await tx.bid.findMany({
        where: { item_id, amount }
      });

      let is_unique = true;
      let duplicatedUsers = [];

      if (existingBids.length > 0) {
        is_unique = false;
        
        // Find previous unique bids and make them false
        const uniqueExisting = existingBids.filter(b => b.is_unique);
        if (uniqueExisting.length > 0) {
          const idsToUpdate = uniqueExisting.map(b => b.id);
          await tx.bid.updateMany({
            where: { id: { in: idsToUpdate } },
            data: { is_unique: false }
          });
          
          duplicatedUsers = uniqueExisting.map(b => b.user_id).filter(id => id !== user_id);
        }
      }

      // 5. Create new bid
      const newBid = await tx.bid.create({
        data: {
          amount,
          is_unique,
          item_id,
          user_id
        }
      });

      // 6. Create Notifications for duplicated users
      for (const dUserId of duplicatedUsers) {
        const message = `Your bid of ${amount} ETB for item "${item.title}" has been duplicated. Place a new unique bid to stay in the lead!`;
        await tx.notification.create({
          data: {
            user_id: dUserId,
            message
          }
        });
        // Emit personal socket event
        io.to(`user_${dUserId}`).emit('bid_duplicated', {
          item_id,
          amount,
          message
        });
      }

      return newBid;
    });

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
