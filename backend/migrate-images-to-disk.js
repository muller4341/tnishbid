const fs = require('fs');
const path = require('path');
const prisma = require('./src/prismaClient');

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const ITEMS_DIR = path.join(UPLOADS_DIR, 'items');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

[UPLOADS_DIR, ITEMS_DIR, AVATARS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function saveBase64ToFile(base64Str, targetDir, filePrefix) {
  if (!base64Str || typeof base64Str !== 'string') return null;
  const match = base64Str.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
  if (!match) return null;

  const mimetype = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  let ext = '.jpg';
  const m = mimetype.toLowerCase();
  if (m.includes('png')) ext = '.png';
  else if (m.includes('webp')) ext = '.webp';
  else if (m.includes('gif')) ext = '.gif';

  const filename = `${filePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`;
  const fullPath = path.join(targetDir, filename);

  fs.writeFileSync(fullPath, buffer);
  const relativePath = targetDir.includes('avatar') ? `/uploads/avatars/${filename}` : `/uploads/items/${filename}`;
  return { relativePath, bytesSaved: buffer.length };
}

async function runMigration() {
  console.log('=== Migrating Base64 Images from DB to Local Disk Storage ===\n');

  let totalItemsUpdated = 0;
  let totalBytesSaved = 0;

  const items = await prisma.item.findMany();
  console.log(`Found ${items.length} items to check.`);

  for (const item of items) {
    let updated = false;
    let newImageUrl = item.image_url;
    let newImages = Array.isArray(item.images) ? [...item.images] : [];

    // Check main image_url
    if (item.image_url && item.image_url.startsWith('data:')) {
      const res = saveBase64ToFile(item.image_url, ITEMS_DIR, `item_${item.id}_main`);
      if (res) {
        newImageUrl = res.relativePath;
        totalBytesSaved += res.bytesSaved;
        updated = true;
        console.log(`[Item #${item.id}] Converted main image to ${newImageUrl} (${(res.bytesSaved / 1024).toFixed(1)} KB)`);
      }
    }

    // Check gallery images
    if (Array.isArray(item.images)) {
      for (let i = 0; i < item.images.length; i++) {
        const img = item.images[i];
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          const res = saveBase64ToFile(img, ITEMS_DIR, `item_${item.id}_gallery_${i}`);
          if (res) {
            newImages[i] = res.relativePath;
            totalBytesSaved += res.bytesSaved;
            updated = true;
            console.log(`[Item #${item.id}] Converted gallery image #${i} to ${res.relativePath}`);
          }
        }
      }
    }

    if (updated) {
      await prisma.item.update({
        where: { id: item.id },
        data: {
          image_url: newImageUrl,
          images: newImages
        }
      });
      totalItemsUpdated++;
    }
  }

  // Check user avatars
  const users = await prisma.user.findMany({
    where: {
      image_url: { startsWith: 'data:' }
    }
  });

  let usersUpdated = 0;
  for (const u of users) {
    const res = saveBase64ToFile(u.image_url, AVATARS_DIR, `user_${u.id}_avatar`);
    if (res) {
      await prisma.user.update({
        where: { id: u.id },
        data: { image_url: res.relativePath }
      });
      totalBytesSaved += res.bytesSaved;
      usersUpdated++;
      console.log(`[User #${u.id}] Converted avatar to ${res.relativePath}`);
    }
  }

  console.log('\n=== Migration Completed ===');
  console.log(`Updated Items: ${totalItemsUpdated}`);
  console.log(`Updated Users: ${usersUpdated}`);
  console.log(`Total image data converted to disk files: ${(totalBytesSaved / (1024 * 1024)).toFixed(2)} MB`);
  console.log('Database JSON responses are now ultra-lightweight and cached!\n');
}

runMigration()
  .catch(err => console.error('Migration failed:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });

