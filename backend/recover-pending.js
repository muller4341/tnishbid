/**
 * Manual & Automatic Recovery Script for Pending Chapa / Telebirr / CBE Payments
 * 
 * Usage:
 *   node recover-pending.js                 -> Scans and recovers ALL pending transactions
 *   node recover-pending.js <TX_REF>        -> Recovers a specific transaction reference
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
  getConfig,
  CHAPA_VERIFY_URL
} = require('./src/controllers/chapaController');

async function processSingleTransaction(txRef) {
  const config = getConfig();
  console.log(`\n--------------------------------------------------`);
  console.log(`🔍 Checking transaction: ${txRef}`);

  const tx = await prisma.transaction.findUnique({
    where: { tx_ref: txRef },
    include: { user: { select: { id: true, name: true, phone_number: true, wallet_balance: true } } }
  });

  if (!tx) {
    console.error(`❌ Transaction "${txRef}" not found in database.`);
    return;
  }

  console.log(`👤 User: ${tx.user?.name || 'N/A'} (${tx.user?.phone_number || tx.user_id})`);
  console.log(`💰 Amount: ${tx.amount} ETB | Bid Amount: ${tx.bid_amount || 'N/A'} ETB`);
  console.log(`📋 DB Status: ${tx.status} | Type: ${tx.payment_type} | Method: ${tx.payment_method}`);

  if (tx.status === 'completed') {
    console.log(`✅ Transaction is ALREADY completed in database.`);
    return;
  }

  console.log(`🌐 Contacting Chapa API to verify payment...`);
  try {
    const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}` }
    });

    const status = String(verified.data?.status || verified.status || '').toLowerCase();
    console.log(`📡 Chapa Verification Status: "${status}"`);

    if (status !== 'success') {
      console.warn(`⚠️ Payment was not approved on Chapa. Status is: "${status}". No changes made.`);
      return;
    }

    const verifiedChapaRef = verified.data?.reference || verified.data?.ref_id || null;
    const verifiedAmount = Number(verified.data?.amount);
    const isWallet = tx.payment_type === 'deposit' || tx.tx_ref.startsWith('tw-') || tx.tx_ref.startsWith('tinish-wallet-');

    if (isWallet) {
      console.log(`💳 Crediting user wallet...`);
      const res = await finalizeWalletDepositRecord({
        txRef: tx.tx_ref,
        verifiedAmount,
        chapaRef: verifiedChapaRef,
        phone: tx.paid_phone,
        method: tx.payment_method
      });
      console.log(`🎉 SUCCESS: Wallet credited! New balance: ${res.updatedUser.wallet_balance} ETB`);
    } else {
      console.log(`🎯 Adding bid to auction...`);
      const res = await finalizeBidPaymentRecord({
        txRef: tx.tx_ref,
        verifiedChapaRef,
        phone: tx.paid_phone,
        paymentMethod: tx.payment_method
      });

      if (res.status === 'refunded_to_wallet') {
        console.log(`ℹ️ AUCTION ENDED: ${res.message}`);
      } else {
        console.log(`🎉 SUCCESS: Bid added to item! Bid ID: ${res.bid?.id}, Amount: ${res.bid?.amount} ETB, Unique: ${res.bid?.is_unique}`);
      }
    }
  } catch (err) {
    console.error(`❌ Error verifying with Chapa:`, err.message);
  }
}

async function main() {
  const targetRef = process.argv[2];

  try {
    if (targetRef) {
      await processSingleTransaction(targetRef.trim());
    } else {
      console.log(`🔍 Scanning for latest pending transactions in database...`);
      const pendingList = await prisma.transaction.findMany({
        where: { status: 'pending' },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      if (pendingList.length === 0) {
        console.log(`✅ No pending transactions found.`);
        return;
      }

      console.log(`Found ${pendingList.length} pending transaction(s). Checking each with Chapa...`);
      for (const tx of pendingList) {
        await processSingleTransaction(tx.tx_ref);
      }
    }
  } catch (error) {
    console.error(`💥 Fatal error:`, error);
  } finally {
    await prisma.$disconnect();
    console.log(`\nDone.`);
  }
}

main();
