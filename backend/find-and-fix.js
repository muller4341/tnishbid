const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('./src/prismaClient');

async function main() {
  // 1. Extend all items to be active for 7 days into the future
  console.log('🔄 Extending all auction items so they are ACTIVE and end in 7 days...');
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await prisma.item.updateMany({
    data: {
      status: 'active',
      end_time: futureDate
    }
  });

  const items = await prisma.item.findMany();
  for (const item of items) {
    console.log(`✅ Item #${item.id} "${item.title}": Status=${item.status}, Ends=${item.end_time.toISOString()}`);
  }

  // 2. Check all transactions
  console.log('\n🔍 Checking pending transactions...');
  const txs = await prisma.transaction.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'desc' },
    include: { user: true }
  });

  console.log(`Found ${txs.length} pending transaction(s).`);
  for (const tx of txs) {
    console.log(`- Tx #${tx.id} (${tx.tx_ref}) User: ${tx.user?.name || tx.user_id} (${tx.paid_phone || tx.user?.phone_number}) Amount: ${tx.amount} ETB, Bid: ${tx.bid_amount} ETB, Date: ${tx.created_at.toISOString()}`);
  }

  await prisma.$disconnect();
}

main();

