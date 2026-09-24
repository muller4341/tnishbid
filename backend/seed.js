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
    // PREMIUM POOL ITEMS (pool_type: 'premium')
    {
      title: 'Porsche 911 Carrera S',
      description: 'Luxury twin-turbo performance sports car. Win this incredible supercar with the lowest unique bid!',
      category: 'Supercars & Vehicles',
      pool_type: 'premium',
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
      pool_type: 'premium',
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
      pool_type: 'premium',
      image_url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=1000',
      base_price: 15.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'Dior Sauvage & Prestige Luxury Gift Box',
      description: 'Exclusive luxury fragrance and skincare prestige collection set.',
      category: 'Cosmetics',
      pool_type: 'premium',
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1000',
      base_price: 12.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'active'
    },

    // OPEN BIDS ITEMS (pool_type: 'open')
    {
      title: 'BMW M4 Competition Coupe',
      description: 'High performance M-TwinPower Turbo coupe with carbon fiber roof.',
      category: 'Supercars & Vehicles',
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
      pool_type: 'open',
      image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=1000',
      base_price: 25.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'Chanel N°5 Grand Parfum Edition',
      description: 'Iconic luxury fragrance in handcrafted crystal bottle.',
      category: 'Cosmetics',
      pool_type: 'open',
      image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=1000',
      base_price: 18.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'Santos de Cartier Automatic Steel Watch',
      description: 'Iconic square mechanical automatic watch with interchangeable leather strap.',
      category: 'Fashion & Luxury',
      pool_type: 'open',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000',
      base_price: 45.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      title: 'Rolex Submariner Date 18k Yellow Gold',
      description: 'Oyster perpetual luxury diving chronograph watch in solid 18k gold.',
      category: 'Fashion & Luxury',
      pool_type: 'open',
      image_url: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=1000',
      base_price: 95.00,
      start_time: new Date(),
      end_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
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
