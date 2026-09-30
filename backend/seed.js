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
  console.log('Admin Verified:', admin.phone_number);

  // Clear existing demo items & bids safely to re-seed clean pool_type items
  await prisma.bid.deleteMany({});
  await prisma.item.deleteMany({});

  const sampleItems = [
    // 3 LUB POOL ITEMS (is_lub: true)
    {
      title: 'Porsche 911 Carrera S',
      description: 'Luxury twin-turbo performance sports car. Win this incredible supercar with the lowest unique bid!',
      category: 'Supercars & Vehicles',
      is_lub: true,
      pool_type: 'lub',
      image_url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1000',
      base_price: 87.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'Segway Gold GT2 Performance Scooter',
      description: 'Super-performance dual motor electric scooter with premium gold finish.',
      category: 'Supercars & Vehicles',
      is_lub: true,
      pool_type: 'lub',
      image_url: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&q=80&w=1000',
      base_price: 10.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'iPhone 15 Pro Gold Edition 256GB',
      description: 'Titanium gold edition iPhone 15 Pro with A17 Pro chip and pro camera system.',
      category: 'Electronics',
      is_lub: true,
      pool_type: 'lub',
      image_url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=1000',
      base_price: 15.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
      status: 'active'
    },

    // 3 OPEN BIDS ITEMS (is_lub: false)
    {
      title: 'BMW M4 Competition Coupe',
      description: 'High performance M-TwinPower Turbo coupe with carbon fiber roof.',
      category: 'Supercars & Vehicles',
      is_lub: false,
      pool_type: 'open',
      image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1000',
      base_price: 120.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'MacBook Pro M3 Max 16-inch Space Black',
      description: 'Extreme performance laptop with 36GB unified memory and Liquid Retina XDR display.',
      category: 'Electronics',
      is_lub: false,
      pool_type: 'open',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
      base_price: 65.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'Sony PlayStation 5 Slim Digital',
      description: 'Next-gen gaming console with 1TB SSD storage and DualSense wireless controller.',
      category: 'Electronics',
      is_lub: false,
      pool_type: 'open',
      image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=1000',
      base_price: 25.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'active'
    }
  ];

  for (const itemData of sampleItems) {
    await prisma.item.create({ data: itemData });
  }

  console.log(`Successfully seeded ${sampleItems.length} items with pool_type!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
