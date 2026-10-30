const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // Prevent "type already exists" collision on PostgreSQL when pushing enum schemas
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
        DROP TYPE IF EXISTS "PaymentType" CASCADE;
        DROP TYPE IF EXISTS "NotificationType" CASCADE;
      EXCEPTION
        WHEN OTHERS THEN null;
      END $$;
    `);
    console.log('Prebuild: PostgreSQL enum sync clean completed.');
  } catch (err) {
    console.warn('Prebuild warning (continuing build):', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

