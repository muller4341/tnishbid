const prisma = require('../prismaClient');
const { isAuctionEndedBackend } = require('./dateHelper');

/**
 * Calculates the winner for an item based on its pool_type and bids.
 * For 'lub' (Lowest Unique Bid):
 *   Groups bids by net value (amount - base_price), finds unique bid amounts,
 *   and picks the bidder with the lowest unique amount.
 * For 'open':
 *   Picks the highest bidder.
 *
 * @param {object} item
 * @returns {{ winnerId: string|null, winningAmount: number|null }}
 */
function calculateWinner(item) {
  const bids = item.bids || [];
  if (bids.length === 0) return { winnerId: null, winningAmount: null };

  const basePrice = parseFloat(item.base_price || 0);
  const getNetBid = (amt) => {
    const a = parseFloat(amt || 0);
    if (basePrice > 0 && a >= basePrice) {
      const net = parseFloat((a - basePrice).toFixed(2));
      return net > 0 ? net : a;
    }
    return parseFloat(a.toFixed(2));
  };

  const isLUB = item.pool_type === 'lub' || item.pool_type === 'premium';

  if (isLUB) {
    const amountMap = {};
    bids.forEach((b) => {
      const amtKey = getNetBid(b.amount).toFixed(2);
      if (!amountMap[amtKey]) amountMap[amtKey] = [];
      amountMap[amtKey].push(b);
    });

    const uniqueKeys = Object.keys(amountMap).filter((k) => amountMap[k].length === 1);
    if (uniqueKeys.length > 0) {
      uniqueKeys.sort((a, b) => parseFloat(a) - parseFloat(b));
      const winningBid = amountMap[uniqueKeys[0]][0];
      return {
        winnerId: winningBid.user_id,
        winningAmount: getNetBid(winningBid.amount)
      };
    }
    return { winnerId: null, winningAmount: null };
  } else {
    const sorted = [...bids].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    return {
      winnerId: sorted[0].user_id,
      winningAmount: parseFloat(sorted[0].amount)
    };
  }
}

/**
 * Settles a single item: sets status to 'ended', assigns winner_id,
 * and notifies winner and participants.
 *
 * @param {number|string} itemId
 * @param {object|null} io
 * @returns {Promise<object|null>}
 */
async function settleItem(itemId, io = null) {
  const parsedId = parseInt(itemId, 10);
  if (isNaN(parsedId)) return null;

  const item = await prisma.item.findUnique({
    where: { id: parsedId },
    include: {
      bids: {
        include: {
          user: { select: { id: true, name: true, phone_number: true, email: true, image_url: true } }
        }
      }
    }
  });

  if (!item) return null;
  // If already ended and has winner_id (or has no bids), no need to re-settle
  if ((item.status === 'ended' || item.status === 'closed') && (item.winner_id || item.bids.length === 0)) {
    return item;
  }

  const { winnerId, winningAmount } = calculateWinner(item);

  const updated = await prisma.item.update({
    where: { id: item.id },
    data: {
      status: 'ended',
      winner_id: winnerId
    },
    include: {
      winner: {
        select: { id: true, name: true, phone_number: true, email: true, image_url: true }
      }
    }
  });

  // Notify winner and participants
  if (winnerId) {
    try {
      const { getUserPreferences } = require('./preferenceStore');
      const winnerPrefs = getUserPreferences(winnerId);
      const winnerMessage = `🎉 Congratulations! You won the auction for "${item.title}" with a winning bid of ${winningAmount || item.base_price} ETB!`;

      if (winnerPrefs.wins !== false) {
        await prisma.notification.create({
          data: {
            user_id: winnerId,
            message: winnerMessage,
            notification_type: 'winning_fee'
          }
        });
        if (io) {
          io.to(`user_${winnerId}`).emit('auction_won', {
            itemId: item.id,
            itemTitle: item.title,
            winningAmount: winningAmount || item.base_price,
            message: winnerMessage
          });
        }
      }

      // Notify other participants
      const otherUserIds = [...new Set(item.bids.map(b => b.user_id).filter(id => id !== winnerId))];
      for (const otherId of otherUserIds) {
        const participantMessage = `The auction for "${item.title}" has concluded. Winner: ${updated.winner?.name || 'Declared Winner'} (${winningAmount || item.base_price} ETB).`;
        await prisma.notification.create({
          data: {
            user_id: otherId,
            message: participantMessage,
            notification_type: 'bid'
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
    } catch (e) {
      console.warn('Notification error during settlement:', e.message);
    }
  }

  if (io) {
    io.emit('bid_update', { item_id: item.id, status: 'ended', winner: updated.winner });
  }

  return updated;
}

/**
 * Checks all active items whose end_time has passed, and settles them automatically.
 *
 * @param {object|null} io
 */
async function settleExpiredAuctions(io = null) {
  try {
    const activeItems = await prisma.item.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        end_time: true
      }
    });

    const expired = activeItems.filter(item => isAuctionEndedBackend(item.end_time));
    for (const item of expired) {
      await settleItem(item.id, io);
    }
  } catch (err) {
    console.error('Error settling expired auctions:', err.message);
  }
}

module.exports = {
  calculateWinner,
  settleItem,
  settleExpiredAuctions
};

