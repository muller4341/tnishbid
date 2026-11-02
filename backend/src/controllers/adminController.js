const prisma = require('../prismaClient');
const { settleItem, settleExpiredAuctions } = require('../utils/settlement');

const buildRealDailyTrend = (bidsArray, daysCount = 7) => {
  const result = [];
  const now = new Date();
  
  // EAT offset (+3 hours for Nairobi / Addis Ababa)
  const eatOffsetMs = 3 * 60 * 60 * 1000;
  const nowEAT = new Date(now.getTime() + eatOffsetMs);

  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDateEAT = new Date(nowEAT);
    targetDateEAT.setUTCDate(targetDateEAT.getUTCDate() - i);
    
    const year = targetDateEAT.getUTCFullYear();
    const month = targetDateEAT.getUTCMonth();
    const day = targetDateEAT.getUTCDate();

    // Start and end of the calendar day in EAT, converted back to UTC for filtering
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - eatOffsetMs);
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - eatOffsetMs);
    
    const dateLabel = targetDateEAT.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
    
    // Filter real bids placed on this calendar day in EAT
    const bidsOnDay = bidsArray.filter(b => {
      const bDate = new Date(b.created_at);
      return bDate >= startOfDay && bDate <= endOfDay;
    });

    const uniqueBidsOnDay = bidsOnDay.filter(b => b.is_unique);

    result.push({
      date: dateLabel,
      fullDate: targetDateEAT.toISOString().split('T')[0],
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
    await settleExpiredAuctions(req.io);
    const closedItemsCount = await prisma.item.count({ where: { status: { in: ['ended', 'closed'] } } });

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
        is_lub: item.pool_type === 'lub' || item.pool_type === 'premium',
        pool_type: item.pool_type || 'open',
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
    const itemId = parseInt(req.params.id, 10);
    const io = req.io;

    const updated = await settleItem(itemId, io);
    if (!updated) return res.status(404).json({ error: 'Item not found' });

    res.json({ message: 'Auction ended successfully', item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserWallet = async (req, res) => {
  try {
    const userId = String(req.params.userId);
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
