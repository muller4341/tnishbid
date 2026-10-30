const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Prebuild: Checking for conflicting PostgreSQL enum types in public schema...');
    const types = await prisma.$queryRawUnsafe(`
      SELECT t.typname, n.nspname, t.typtype
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typtype = 'e'
        AND (
          t.typname ILIKE '%payment%'
          OR t.typname ILIKE '%notification%'
        )
    `);

    if (types && types.length > 0) {
      console.log(`Prebuild: Found ${types.length} enum type(s) to clean:`, types.map(t => t.typname));
      for (const t of types) {
        console.log(`Prebuild: Dropping enum type "${t.typname}" with CASCADE...`);
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${t.typname}" CASCADE`);
      }
      console.log('Prebuild: All conflicting enums dropped successfully.');
    } else {
      console.log('Prebuild: No conflicting enum types found.');
    }
  } catch (err) {
    console.warn('Prebuild warning:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
