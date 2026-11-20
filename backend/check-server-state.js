const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('./src/prismaClient');
const { isAuctionEndedBackend } = require('./src/utils/dateHelper');

async function main() {
  console.log('Current System Time:', new Date().toISOString());

  const items = await prisma.item.findMany();
  console.log(`\nFound ${items.length} item(s):`);
  for (const item of items) {
    const isEnded = isAuctionEndedBackend(item.end_time);
    console.log(`Item #${item.id} "${item.title}":`);
    console.log(`  Status: ${item.status}`);
    console.log(`  End time: ${item.end_time.toISOString()}`);
    console.log(`  isAuctionEndedBackend: ${isEnded}`);
  }

  const txs = await prisma.transaction.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log(`\nLast ${txs.length} transactions:`);
  for (const t of txs) {
    console.log(`Tx #${t.id} ${t.tx_ref}: status=${t.status}, amount=${t.amount}, bid_amount=${t.bid_amount}, type=${t.payment_type}, created_at=${t.created_at.toISOString()}`);
  }

  await prisma.$disconnect();
}

main();

