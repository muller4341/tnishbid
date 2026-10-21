const prisma = require('../prismaClient');
const { optimizeCloudinaryUrl } = require('../utils/cloudinary');

// Helper to mask phone numbers safely: e.g. "2519039***11" or "0943***20"
const maskPhoneNumber = (phone) => {
  if (!phone) return '2519000***00';
  const str = phone.toString().trim();
  if (str.length >= 10) {
    const prefix = str.slice(0, str.length - 4);
    const suffix = str.slice(-2);
    return `${prefix}***${suffix}`;
  }
  if (str.length > 5) {
    return `${str.slice(0, 3)}***${str.slice(-2)}`;
  }
  return str;
};

// Formats an auction / entry code: e.g. "#QP7QVT"
const getAuctionCode = (item) => {
  const hex = item.id.toString(36).toUpperCase().padStart(6, '0');
  return `#${hex}`;
};

exports.getDraws = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        winner: {
          select: { id: true, name: true, phone_number: true, image_url: true }
        },
        bids: {
          include: {
            user: {
              select: { id: true, name: true, phone_number: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { end_time: 'desc' }
    });

    const now = new Date();

    const pastDraws = [];
    const upcomingDraws = [];

    items.forEach((item) => {
      const isPast =
        item.status === 'closed' ||
        item.winner_id !== null ||
        (item.end_time && new Date(item.end_time) <= now);

      const itemBids = item.bids || [];
      const totalBids = itemBids.length;

      // Group bids to find unique amounts
      const amountCounts = {};
      // Group all bids by formatted 2-decimal amount to guarantee exact uniqueness
      const amountMap = {};
      itemBids.forEach((b) => {
        const amtKey = parseFloat(b.amount).toFixed(2);
        if (!amountMap[amtKey]) amountMap[amtKey] = [];
        amountMap[amtKey].push(b);
      });

      const uniqueAmounts = Object.keys(amountMap).filter((amt) => amountMap[amt].length === 1);
      const uniqueAmountsCount = uniqueAmounts.length;

      // Determine winning bid: GUARANTEED LOWEST UNIQUE BID
      let winnerUser = null;
      let winningAmount = null;

      if (uniqueAmounts.length > 0) {
        // Sort ascending to get the lowest unique bid
        uniqueAmounts.sort((a, b) => parseFloat(a) - parseFloat(b));
        const lowestUniqueKey = uniqueAmounts[0];
        winningAmount = parseFloat(lowestUniqueKey);
        const winBid = amountMap[lowestUniqueKey][0];
        winnerUser = winBid.user || item.winner;
      } else if (itemBids.length > 0) {
        // If no unique bid exists, fallback to lowest bid placed earliest
        const sorted = [...itemBids].sort((a, b) => 
          parseFloat(a.amount) - parseFloat(b.amount) || 
          new Date(a.created_at) - new Date(b.created_at)
        );
        winningAmount = parseFloat(sorted[0].amount);
        winnerUser = sorted[0].user || item.winner;
      } else if (item.winner) {
        winnerUser = item.winner;
        winningAmount = parseFloat(item.base_price || 0.1);
      }

      const auctionCode = getAuctionCode(item);
      const optimizedImage = optimizeCloudinaryUrl(item.image_url);

      if (isPast) {
        pastDraws.push({
          id: item.id,
          title: item.title,
          description: item.description,
          image_url: optimizedImage,
          category: item.category,
          base_price: item.base_price,
          start_time: item.start_time,
          end_time: item.end_time,
          status: 'closed',
          auction_code: auctionCode,
          entry_code: `Entry ${auctionCode}`,
          announced_at: item.end_time,
          total_bids: totalBids,
          unique_amounts_count: uniqueAmountsCount,
          winning_amount: winningAmount !== null ? Number(winningAmount) : Number(item.base_price || 0.1),
          winner: winnerUser
            ? {
                id: winnerUser.id,
                name: winnerUser.name,
                masked_phone: maskPhoneNumber(winnerUser.phone_number),
                phone_number: winnerUser.phone_number
              }
            : {
                id: null,
                name: 'Winner Announced',
                masked_phone: '2519039***11',
                phone_number: ''
              }
        });
      } else {
        upcomingDraws.push({
          id: item.id,
          title: item.title,
          description: item.description,
          image_url: optimizedImage,
          category: item.category,
          base_price: item.base_price,
          start_time: item.start_time,
          end_time: item.end_time,
          status: 'active',
          auction_code: auctionCode,
          total_bids: totalBids
        });
      }
    });

    res.json({
      pastDraws,
      upcomingDraws
    });
  } catch (err) {
    console.error('Error fetching draws:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDrawDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid draw ID' });

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        winner: {
          select: { id: true, name: true, phone_number: true, email: true, image_url: true }
        },
        bids: {
          include: {
            user: {
              select: { id: true, name: true, phone_number: true }
            }
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!item) return res.status(404).json({ error: 'Draw item not found' });

    const itemBids = item.bids || [];
    const totalBids = itemBids.length;

    // Group bids by amount
    const grouped = {};
    itemBids.forEach((b) => {
      const amtKey = parseFloat(b.amount).toFixed(2);
      if (!grouped[amtKey]) {
        grouped[amtKey] = {
          amount: parseFloat(amtKey),
          bids: [],
          userIds: new Set()
        };
      }
      grouped[amtKey].bids.push({
        id: b.id,
        user_id: b.user_id,
        masked_phone: maskPhoneNumber(b.user?.phone_number || '251911000000'),
        created_at: b.created_at
      });
      if (b.user_id) grouped[amtKey].userIds.add(b.user_id);
    });

    // Find winning bid: GUARANTEED LOWEST UNIQUE BID
    let winnerUser = null;
    let winningAmount = null;

    const uniqueKeys = Object.keys(grouped).filter((k) => grouped[k].bids.length === 1);
    if (uniqueKeys.length > 0) {
      // Strictly sort by amount ascending -> lowest unique bid
      uniqueKeys.sort((a, b) => parseFloat(a) - parseFloat(b));
      const lowestUniqueKey = uniqueKeys[0];
      winningAmount = parseFloat(lowestUniqueKey).toFixed(2);
      const winBid = itemBids.find((b) => parseFloat(b.amount).toFixed(2) === lowestUniqueKey);
      winnerUser = winBid?.user || item.winner;
    } else if (itemBids.length > 0) {
      // If no unique bid exists across all amounts, fallback to lowest bid earliest created
      const sortedBids = [...itemBids].sort((a, b) => 
        parseFloat(a.amount) - parseFloat(b.amount) || 
        new Date(a.created_at) - new Date(b.created_at)
      );
      winningAmount = parseFloat(sortedBids[0].amount).toFixed(2);
      winnerUser = sortedBids[0].user || item.winner;
    } else if (item.winner) {
      winnerUser = item.winner;
      winningAmount = parseFloat(item.base_price || 0.1).toFixed(2);
    }

    // Build amount breakdown list
    const amountBreakdown = Object.keys(grouped).map((amtKey) => {
      const g = grouped[amtKey];
      return {
        amount: g.amount,
        amountFormatted: `${g.amount.toFixed(2)} ETB`,
        bidsCount: g.bids.length,
        playersCount: g.userIds.size,
        isUnique: g.bids.length === 1,
        isWinning: winningAmount !== null && parseFloat(winningAmount) === g.amount,
        bids: g.bids.map((b, idx) => ({
          ...b,
          index: idx + 1
        }))
      };
    });

    // Sort by amount ascending by default
    amountBreakdown.sort((a, b) => a.amount - b.amount);

    const maxBidsPerAmount = amountBreakdown.length > 0
      ? Math.max(...amountBreakdown.map((a) => a.bidsCount))
      : 1;

    const uniqueAmountsCount = amountBreakdown.filter((a) => a.isUnique).length;
    const auctionCode = getAuctionCode(item);

    res.json({
      item: {
        id: item.id,
        title: item.title,
        description: item.description,
        image_url: optimizeCloudinaryUrl(item.image_url),
        category: item.category,
        base_price: item.base_price,
        start_time: item.start_time,
        end_time: item.end_time,
        status: item.status,
        auction_code: auctionCode,
        entry_code: `Entry ${auctionCode}`,
        announced_at: item.end_time
      },
      winner: {
        id: winnerUser?.id || null,
        name: winnerUser?.name || 'Winner',
        masked_phone: maskPhoneNumber(winnerUser?.phone_number || '2519039***11'),
        winning_amount: winningAmount ? parseFloat(winningAmount) : item.base_price,
        entry_code: `Entry ${auctionCode}`
      },
      stats: {
        bidFee: `${(item.base_price || 0).toFixed(2)} ETB`,
        totalBids: totalBids,
        uniqueAmountsCount: uniqueAmountsCount,
        auctionCode: auctionCode,
        winningAmount: winningAmount ? `${parseFloat(winningAmount).toFixed(2)} ETB` : `${(item.base_price || 0).toFixed(2)} ETB`,
        maxBidsPerAmount: maxBidsPerAmount
      },
      amountBreakdown
    });
  } catch (err) {
    console.error('Error fetching draw details:', err);
    res.status(500).json({ error: err.message });
  }
};
