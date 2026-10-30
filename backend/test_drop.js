const prisma = require('./src/prismaClient');

async function testDrop() {
  try {
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PaymentMethod" CASCADE;`);
    console.log('Drop PaymentMethod succeeded');
  } catch (e) {
    console.error('Drop error:', e);
  }
}

testDrop()
  .finally(async () => {
    await prisma.$disconnect();
  });

