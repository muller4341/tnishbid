const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcryptjs');

async function main() {
  const password_hash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { phone_number: '0911000000' },
    update: {},
    create: {
      name: 'System Admin',
      phone_number: '0911000000',
      email: 'admin@tinishbid.com',
      password_hash,
      role: 'admin',
      wallet_balance: 9999.00
    }
  });
  console.log('Created Admin:', admin.phone_number);

  const item = await prisma.item.create({
    data: {
      title: 'iPhone 15 Pro Max - 256GB Titanium',
      description: 'Brand new, sealed iPhone 15 Pro Max. Win this amazing device with the lowest unique bid!',
      image_url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=1000',
      base_price: 50.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: 'active'
    }
  });
  console.log('Created item:', item);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
