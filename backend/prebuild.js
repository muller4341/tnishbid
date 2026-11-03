const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Prebuild: Cleaning up any legacy PostgreSQL types...');
    const dropStatements = [
      'DROP TYPE IF EXISTS "PaymentMethod" CASCADE;',
      'DROP TYPE IF EXISTS "PaymentType" CASCADE;',
      'DROP TYPE IF EXISTS "NotificationType" CASCADE;',
      'DROP TYPE IF EXISTS paymentmethod CASCADE;',
      'DROP TYPE IF EXISTS paymenttype CASCADE;',
      'DROP TYPE IF EXISTS notificationtype CASCADE;',
      'DROP TABLE IF EXISTS "PaymentMethod" CASCADE;',
      'DROP TABLE IF EXISTS "PaymentType" CASCADE;',
      'DROP TABLE IF EXISTS "NotificationType" CASCADE;'
    ];

    for (const sql of dropStatements) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        // Ignore errors
      }
    }

    console.log('Prebuild: Ensuring Africa/Addis_Ababa timezone defaults for created_at...');
    const timezoneStatements = [
      `ALTER TABLE "User" ALTER COLUMN "created_at" SET DEFAULT timezone('Africa/Addis_Ababa', now());`,
      `ALTER TABLE "Item" ALTER COLUMN "created_at" SET DEFAULT timezone('Africa/Addis_Ababa', now());`,
      `ALTER TABLE "Transaction" ALTER COLUMN "created_at" SET DEFAULT timezone('Africa/Addis_Ababa', now());`,
      `ALTER TABLE "Transaction" ALTER COLUMN "updated_at" SET DEFAULT timezone('Africa/Addis_Ababa', now());`,
      `ALTER TABLE "Bid" ALTER COLUMN "created_at" SET DEFAULT timezone('Africa/Addis_Ababa', now());`,
      `ALTER TABLE "Notification" ALTER COLUMN "created_at" SET DEFAULT timezone('Africa/Addis_Ababa', now());`
    ];

    for (const sql of timezoneStatements) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        // Table might not exist yet before first db push, safe to ignore
      }
    }
    console.log('Prebuild: Cleanup completed.');
  } catch (err) {
    console.warn('Prebuild notice:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
