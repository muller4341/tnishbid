/**
 * Emergency Fix & Auction Activation Script for TinishBid
 * 
 * 1. Resets all auction items to 'active' status and extends their end_time by 14 days.
 * 2. Scans for any pending payments from customers, verifies them with Chapa,
 *    and converts them into confirmed bids immediately!
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('./src/prismaClient');
const {
  finalizeBidPaymentRecord,
  finalizeWalletDepositRecord,
  chapaRequest,
  CHAPA_VERIFY_URL
} = require('./src/controllers/chapaController');

async function main() {
  console.log('====================================================');
  console.log('🚀 TINISHBID RECOVERY & AUCTION ACTIVATION');
  console.log('====================================================');
  console.log('Current System Time:', new Date().toISOString());

  // Step 1: Extend and activate all auction items
  console.log('\n[1/3] Activating all auctions and extending end times by 14 days...');
  const newEndTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const updated = await prisma.item.updateMany({
    data: {
      status: 'active',
      end_time: newEndTime,
      winner_id: null
    }
  });
  console.log(`✅ ${updated.count} items updated to ACTIVE (Ends: ${newEndTime.toISOString()}).`);

  // Step 2: Query all pending transactions
  console.log('\n[2/3] Checking for any paid transactions from customers...');
  const pendingTransactions = await prisma.transaction.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'desc' },
    include: { user: true }
  });

  console.log(`Found ${pendingTransactions.length} pending transaction(s). Verifying each with Chapa...`);

  let convertedCount = 0;
  for (const tx of pendingTransactions) {
    try {
      const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(tx.tx_ref)}`, {
        method: 'GET'
      });

      const chapaStatus = String(verified.data?.status || verified.status || '').toLowerCase();
      if (chapaStatus === 'success') {
        console.log(`\n🎉 PAID TRANSACTION DETECTED: ${tx.tx_ref}`);
        console.log(`   User: ${tx.user?.name || tx.user_id} (${tx.paid_phone || tx.user?.phone_number})`);
        console.log(`   Amount: ${tx.amount} ETB | Bid Amount: ${tx.bid_amount} ETB`);

        const isWallet = tx.payment_type === 'deposit' || tx.tx_ref.startsWith('tw-') || tx.tx_ref.startsWith('tinish-wallet-');
        if (isWallet) {
          const res = await finalizeWalletDepositRecord({
            txRef: tx.tx_ref,
            verifiedAmount: Number(verified.data?.amount || tx.amount),
            chapaRef: verified.data?.reference || null,
            phone: tx.paid_phone,
            method: tx.payment_method
          });
          console.log(`   ✅ Credited wallet! Balance: ${res.updatedUser?.wallet_balance} ETB`);
        } else {
          const res = await finalizeBidPaymentRecord({
            txRef: tx.tx_ref,
            verifiedChapaRef: verified.data?.reference || null,
            phone: tx.paid_phone,
            paymentMethod: tx.payment_method
          });
          if (res.status === 'refunded_to_wallet') {
            console.log(`   ℹ️ Refunded fee to wallet: ${res.message}`);
          } else {
            console.log(`   ✅ BID SUCCESSFULLY CREATED! Bid ID: ${res.bid?.id}, Amount: ${res.bid?.amount} ETB`);
          }
        }
        convertedCount++;
      }
    } catch (err) {
      // Transaction was not completed on Chapa / cancelled
    }
  }

  console.log(`\n[3/3] Total completed transactions converted: ${convertedCount}`);

  // Summary
  const activeItems = await prisma.item.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      end_time: true,
      _count: { select: { bids: true } }
    }
  });

  console.log('\n====================================================');
  console.log('📋 CURRENT LIVE AUCTIONS:');
  console.log('====================================================');
  for (const it of activeItems) {
    console.log(`Item #${it.id}: "${it.title}" | Status: ${it.status} | Bids: ${it._count.bids} | Ends: ${it.end_time.toISOString()}`);
  }
  console.log('====================================================\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});

