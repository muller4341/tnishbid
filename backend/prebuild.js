const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Prebuild: Starting database cleanup for conflicting enum/table definitions...');

    const explicitNames = [
      'PaymentMethod', 'paymentmethod',
      'PaymentType', 'paymenttype',
      'NotificationType', 'notificationtype'
    ];

    // 1. Drop any conflicting tables or views first (PostgreSQL creates composite types for tables/views)
    for (const name of explicitNames) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${name}" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public."${name}" CASCADE;`);
      } catch (e) {
        console.warn(`DROP TABLE ${name} notice:`, e.message);
      }
      try {
        await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "${name}" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS public."${name}" CASCADE;`);
      } catch (e) {
        console.warn(`DROP VIEW ${name} notice:`, e.message);
      }
    }

    // 2. Drop any enum or composite types
    for (const name of explicitNames) {
      try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${name}" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS public."${name}" CASCADE;`);
      } catch (e) {
        console.warn(`DROP TYPE ${name} notice:`, e.message);
      }
    }

    // 3. Dynamic search across all schemas in pg_type for any leftover matching names
    try {
      const leftoverTypes = await prisma.$queryRawUnsafe(`
        SELECT t.typname, n.nspname
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE (
          t.typname ILIKE 'PaymentMethod'
          OR t.typname ILIKE 'PaymentType'
          OR t.typname ILIKE 'NotificationType'
        )
      `);

      if (leftoverTypes && leftoverTypes.length > 0) {
        console.log('Prebuild: Found leftover types in pg_type:', leftoverTypes);
        for (const t of leftoverTypes) {
          try {
            await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${t.nspname}"."${t.typname}" CASCADE;`);
            console.log(`Prebuild: Dropped leftover type "${t.nspname}"."${t.typname}"`);
          } catch (e) {
            console.warn(`Failed to drop leftover type "${t.nspname}"."${t.typname}":`, e.message);
          }
        }
      }
    } catch (err) {
      console.warn('Prebuild dynamic check warning:', err.message);
    }

    console.log('Prebuild: Cleanup completed successfully.');
  } catch (err) {
    console.warn('Prebuild warning:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
