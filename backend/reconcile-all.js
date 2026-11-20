const prisma = require('./src/prismaClient');
const https = require('https');

const CHAPA_KEYS = [
  'CHASECK-tM93dX4JwoCsV2kKlaXpBVgraUUuhIbM',
  'CHASECK-Ryg9wi0dyiyB1N3mm63LsOBY9iXcw2SI'
];

async function verifyWithChapa(txRef) {
  for (const key of CHAPA_KEYS) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.chapa.co',
          port: 443,
          path: `/v1/transaction/verify/${encodeURIComponent(txRef)}`,
          method: 'GET',
          headers: { Authorization: `Bearer ${key}` }
        }, (res) => {
          let data = '';
          res.on('data', d => data += d);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); resolve(null); });
        req.end();
      });
      if (res && (res.status === 'success' || res.data?.status === 'success')) {
        return res;
      }
    } catch (err) {
      // try next key
    }
  }
  return null;
}

async function reconcile() {
  console.log('=== Starting Bid Reconciliation on TinishBid ===\n');

  // 1. Ensure Item #10 is active and ends in 14 days
  const item10 = await prisma.item.findUnique({ where: { id: 10 } });
  if (item10) {
    await prisma.item.update({
      where: { id: 10 },
      data: {
        status: 'active',
        end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        winner_id: null
      }
    });
    console.log(`[Item #10] Updated to status: "active", extended end_time to +14 days.`);
  }

  // 2. Find all transactions that look like bid payments
  const allTxs = await prisma.transaction.findMany({
    where: {
      OR: [
        { tx_ref: { contains: 'tinish-inline-' } },
        { tx_ref: { contains: 'tinish-bid-' } },
        { payment_type: 'bid_purchase' }
      ]
    },
    orderBy: { created_at: 'asc' }
  });

  console.log(`Found ${allTxs.length} bid transactions in database.\n`);

  let reconciledCount = 0;
  let alreadyGoodCount = 0;

  for (const tx of allTxs) {
    const parts = tx.tx_ref.split('-');
    // format: tinish-inline-{userId}-{itemId}-{timestamp}-{random}
    // parts[2] is userId, parts[3] is itemId
    let targetItemId = null;
    let targetUserId = tx.user_id;

    if (parts.length >= 4) {
      const parsedId = parseInt(parts[3], 10);
      if (!isNaN(parsedId) && parsedId > 0) targetItemId = parsedId;
      if (!targetUserId && parts[2]) targetUserId = parts[2];
    }
    if (!targetItemId) targetItemId = 10;

    // Check if bid is already linked
    const existingBid = await prisma.bid.findFirst({
      where: {
        OR: [
          { transaction_id: tx.id },
          { user_id: targetUserId, item_id: targetItemId }
        ]
      }
    });

    // Check if paid in DB or verify with Chapa
    let isPaid = tx.status === 'completed';
    let chapaRef = tx.chapa_ref;

    if (!isPaid) {
      const chapaRes = await verifyWithChapa(tx.tx_ref);
      if (chapaRes && (chapaRes.status === 'success' || chapaRes.data?.status === 'success')) {
        isPaid = true;
        chapaRef = chapaRes.data?.reference || chapaRes.data?.ref_id || chapaRef;
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'completed', chapa_ref: chapaRef }
        });
        console.log(`[Chapa Verified] Tx ${tx.tx_ref} verified as paid in Chapa!`);
      }
    }

    if (isPaid && !existingBid) {
      // Item
      const targetItem = await prisma.item.findUnique({ where: { id: targetItemId } });
      let bidAmount = Number(tx.bid_amount);
      if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
        bidAmount = Number(targetItem?.base_price) > 0 ? Number(targetItem.base_price) : 1.00;
      }

      // Ensure item is active
      if (targetItem && targetItem.status !== 'active') {
        await prisma.item.update({
          where: { id: targetItemId },
          data: { status: 'active', end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
        });
      }

      // Check unique
      const existingSameAmount = await prisma.bid.findFirst({
        where: { item_id: targetItemId, amount: bidAmount }
      });
      const isUnique = !existingSameAmount;

      const newBid = await prisma.bid.create({
        data: {
          item_id: targetItemId,
          user_id: targetUserId,
          amount: bidAmount,
          is_unique: isUnique,
          transaction_id: tx.id
        }
      });

      console.log(`>>> [RECONCILED] Created Bid #${newBid.id} for User "${targetUserId}" on Item #${targetItemId} (Amount: ${bidAmount} ETB, Tx: ${tx.tx_ref})`);
      reconciledCount++;
    } else if (existingBid) {
      alreadyGoodCount++;
    }
  }

  console.log(`\n=== Reconciliation Complete ===`);
  console.log(`Reconciled / Newly Created Bids: ${reconciledCount}`);
  console.log(`Already Existing Bids: ${alreadyGoodCount}`);

  // 3. Print summary of bids for user Muller (0BMRWX) and Item #10
  const mullerBids = await prisma.bid.findMany({
    where: { user_id: '0BMRWX' },
    include: { item: { select: { id: true, title: true, status: true, end_time: true } } },
    orderBy: { created_at: 'desc' }
  });

  console.log(`\nUser 0BMRWX (Muller) now has ${mullerBids.length} bids in database:`);
  mullerBids.forEach(b => {
    console.log(` - Bid #${b.id}: Item #${b.item_id} (${b.item?.title}), Amount: ${b.amount} ETB, Unique: ${b.is_unique}, Item Status: ${b.item?.status}`);
  });

  const totalItem10Bids = await prisma.bid.count({ where: { item_id: 10 } });
  console.log(`Total bids on Item #10: ${totalItem10Bids}\n`);
}

reconcile()
  .catch(err => {
    console.error('Reconciliation error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

