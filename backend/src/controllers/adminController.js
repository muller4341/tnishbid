const prisma = require('../prismaClient');

const buildRealDailyTrend = (bidsArray, daysCount = 7) => {
  const result = [];
  const now = new Date();
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - i);
    
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    
    const dateLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Filter real bids placed on this calendar day
    const bidsOnDay = bidsArray.filter(b => {
      const bDate = new Date(b.created_at);
      return bDate >= startOfDay && bDate <= endOfDay;
    });

    const uniqueBidsOnDay = bidsOnDay.filter(b => b.is_unique);

    result.push({
      date: dateLabel,
      fullDate: startOfDay.toISOString().split('T')[0],
      bids: bidsOnDay.length,
      uniqueBids: uniqueBidsOnDay.length,
      duplicatedBids: bidsOnDay.length - uniqueBidsOnDay.length,
      revenue: bidsOnDay.length * 1.0 // 1 ETB per bid
    });
  }
  
  return result;
};

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Basic counts
    const totalUsers = await prisma.user.count();
    const totalBids = await prisma.bid.count();
    const activeItemsCount = await prisma.item.count({ where: { status: 'active' } });
    const closedItemsCount = await prisma.item.count({ where: { status: 'closed' } });

    // 2. Total revenue estimate (Bid fees + user wallet balances)
    const walletAgg = await prisma.user.aggregate({
      _sum: { wallet_balance: true }
    });
    const totalWalletBalances = walletAgg._sum.wallet_balance || 0;
    const totalBidFeeRevenue = totalBids * 1.0; // 1 ETB per bid
    const totalRevenue = totalBidFeeRevenue + totalWalletBalances;

    // 3. Fetch all items with their bid counts, unique bids, user details, and winner info
    const items = await prisma.item.findMany({
      include: {
        winner: {
          select: { id: true, name: true, phone_number: true, email: true, image_url: true }
        },
        bids: {
          include: {
            user: {
              select: { id: true, name: true, phone_number: true, email: true, image_url: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const allBids = items.flatMap(item => item.bids || []);

    const productStats = items.map(item => {
      const itemBids = item.bids || [];
      const totalItemBids = itemBids.length;
      const uniqueBids = itemBids.filter(b => b.is_unique);
      
      // Calculate Lowest Unique Bid & Bidder
      let lubAmount = null;
      let lubBidder = null;
      if (uniqueBids.length > 0) {
        const sortedUnique = [...uniqueBids].sort((a, b) => a.amount - b.amount);
        lubAmount = sortedUnique[0].amount;
        lubBidder = sortedUnique[0].user;
      }

      // Calculate Highest Bid
      let highestBid = null;
      if (itemBids.length > 0) {
        highestBid = Math.max(...itemBids.map(b => b.amount));
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        category: item.category,
        is_lub: item.is_lub || item.pool_type === 'lub' || item.pool_type === 'premium',
        pool_type: (item.is_lub || item.pool_type === 'lub' || item.pool_type === 'premium') ? 'lub' : 'open',
        base_price: item.base_price,
        start_time: item.start_time,
        end_time: item.end_time,
        status: item.status,
        winner: item.winner,
        winner_id: item.winner_id,
        totalBids: totalItemBids,
        uniqueBidsCount: uniqueBids.length,
        duplicatedBidsCount: totalItemBids - uniqueBids.length,
        lowestUniqueBid: lubAmount,
        lowestUniqueBidder: lubBidder,
        highestBid: highestBid,
        dailyTrend7: buildRealDailyTrend(itemBids, 7),
        dailyTrend30: buildRealDailyTrend(itemBids, 30),
        bids: itemBids.map(b => ({
          id: b.id,
          amount: b.amount,
          is_unique: b.is_unique,
          created_at: b.created_at,
          user_id: b.user_id,
          user_name: b.user ? b.user.name : 'Anonymous User',
          user_phone: b.user ? b.user.phone_number : 'N/A',
          user_email: b.user ? b.user.email : 'N/A',
          user_image: b.user ? b.user.image_url : null
        }))
      };
    });

    // 4. Combined real system-wide bidding trends (7d and 30d)
    const biddingTrend7 = buildRealDailyTrend(allBids, 7);
    const biddingTrend30 = buildRealDailyTrend(allBids, 30);

    // 5. Users List with activity counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone_number: true,
        email: true,
        role: true,
        wallet_balance: true,
        image_url: true,
        created_at: true,
        _count: {
          select: { bids: true, won_items: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      phone_number: u.phone_number,
      email: u.email,
      role: u.role,
      wallet_balance: u.wallet_balance,
      image_url: u.image_url || null,
      created_at: u.created_at,
      totalBids: u._count.bids,
      itemsWon: u._count.won_items
    }));

    // 6. Winners List
    const winnersList = items
      .filter(i => i.winner)
      .map(i => {
        const winningBid = i.bids.find(b => b.user_id === i.winner_id);
        return {
          itemId: i.id,
          itemTitle: i.title,
          itemCategory: i.category,
          winnerId: i.winner.id,
          winnerName: i.winner.name,
          winnerPhone: i.winner.phone_number,
          winnerImage: i.winner.image_url || null,
          winningBid: winningBid ? winningBid.amount : i.base_price,
          endedAt: i.end_time
        };
      });

    res.json({
      summary: {
        totalUsers,
        totalBids,
        totalRevenue,
        activeItemsCount,
        closedItemsCount,
        totalWinners: winnersList.length
      },
      productStats,
      biddingTrend: biddingTrend7,
      biddingTrend7,
      biddingTrend30,
      users: formattedUsers,
      winners: winnersList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.endAuction = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const io = req.io;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { bids: true }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status === 'closed') return res.status(400).json({ error: 'Auction is already closed' });

    // Calculate winner: Lowest Unique Bid
    const uniqueBids = item.bids.filter(b => b.is_unique);
    let winnerId = null;
    let winningAmount = null;

    if (uniqueBids.length > 0) {
      // Find bid with smallest amount
      uniqueBids.sort((a, b) => a.amount - b.amount);
      winnerId = uniqueBids[0].user_id;
      winningAmount = uniqueBids[0].amount;
    } else if (item.bids.length > 0) {
      // Fallback to highest bid if no unique bid exists
      const sortedBids = [...item.bids].sort((a, b) => b.amount - a.amount);
      winnerId = sortedBids[0].user_id;
      winningAmount = sortedBids[0].amount;
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'closed',
        winner_id: winnerId
      },
      include: { 
        winner: { select: { id: true, name: true, phone_number: true, email: true, image_url: true } }
      }
    });

    if (winnerId) {
      const winnerMessage = `🎉 Congratulations! You won the auction for "${item.title}" with a winning bid of ${winningAmount || item.base_price} ETB!`;
      await prisma.notification.create({
        data: {
          user_id: winnerId,
          message: winnerMessage
        }
      });
      if (io) {
        io.to(`user_${winnerId}`).emit('auction_won', {
          itemId: item.id,
          itemTitle: item.title,
          message: winnerMessage
        });
      }

      // Notify other participants that auction has concluded
      const otherUserIds = [...new Set(item.bids.map(b => b.user_id).filter(id => id !== winnerId))];
      for (const otherId of otherUserIds) {
        const participantMessage = `The auction for "${item.title}" has concluded. Winner: ${updated.winner?.name || 'Declared Winner'} (${winningAmount || item.base_price} ETB).`;
        await prisma.notification.create({
          data: {
            user_id: otherId,
            message: participantMessage
          }
        });
        if (io) {
          io.to(`user_${otherId}`).emit('auction_ended', {
            itemId: item.id,
            itemTitle: item.title,
            message: participantMessage
          });
        }
      }
    }

    // Broadcast global update to update clients
    if (io) {
      io.emit('bid_update', { item_id: itemId, status: 'closed', winner: updated.winner });
    }

    res.json({ message: 'Auction closed successfully', item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserWallet = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { amount } = req.body; // positive to add, negative to deduct

    if (isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        wallet_balance: { increment: parseFloat(amount) }
      },
      select: { id: true, name: true, phone_number: true, wallet_balance: true }
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
