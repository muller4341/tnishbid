const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const ITEMS_DIR = path.join(UPLOADS_DIR, 'items');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

// Ensure upload directories exist
[UPLOADS_DIR, ITEMS_DIR, AVATARS_DIR].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // ignore
  }
});

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret'
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
    timeout: 60000
  });
}

/**
 * Saves binary buffer directly to local server disk in /uploads/
 * Ultra-fast, zero external dependency, 0ms latency.
 */
const saveLocally = (buffer, mimetype = 'image/jpeg', folder = 'tinishbid/items') => {
  const isAvatar = folder.includes('avatar');
  const targetDir = isAvatar ? AVATARS_DIR : ITEMS_DIR;
  const subFolder = isAvatar ? 'avatars' : 'items';

  let ext = '.jpg';
  const m = (mimetype || '').toLowerCase();
  if (m.includes('png')) ext = '.png';
  else if (m.includes('webp')) ext = '.webp';
  else if (m.includes('gif')) ext = '.gif';
  else if (m.includes('svg')) ext = '.svg';

  const filename = `${subFolder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filepath = path.join(targetDir, filename);

  fs.writeFileSync(filepath, buffer);
  return `/uploads/${subFolder}/${filename}`;
};

/**
 * Decodes and saves a Base64 data URI to local server disk
 */
const saveBase64Locally = (base64String, folder = 'tinishbid/items') => {
  if (!base64String || typeof base64String !== 'string') return base64String;
  const match = base64String.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
  if (!match) return base64String;

  const mimetype = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return saveLocally(buffer, mimetype, folder);
};

/**
 * Ensures a Cloudinary URL uses automatic format (WebP/AVIF) and quality optimization
 */
const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }
  if (url.includes('/image/upload/f_auto,q_auto/') || url.includes('/upload/f_auto,q_auto/')) {
    return url;
  }
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
};

/**
 * Universal image uploader:
 * 1. If string is already a path/URL, returns it.
 * 2. If Base64 string, writes directly to local server disk.
 * 3. If file buffer, writes directly to local server disk or Cloudinary if explicitly configured.
 */
const uploadImage = async (input, options = {}) => {
  if (!input) return null;
  const folder = options.folder || 'tinishbid/items';

  // 1. String inputs
  if (typeof input === 'string') {
    if (input.startsWith('/uploads/')) return input;
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return optimizeCloudinaryUrl(input);
    }
    if (input.startsWith('data:')) {
      return saveBase64Locally(input, folder);
    }
    return input;
  }

  // 2. Multer file object with buffer
  const buffer = input.buffer && Buffer.isBuffer(input.buffer) ? input.buffer : (Buffer.isBuffer(input) ? input : null);
  const mimetype = input.mimetype || 'image/jpeg';

  if (buffer) {
    // If Cloudinary is explicitly configured with real credentials, we can use it
    if (isConfigured) {
      try {
        const base64Data = `data:${mimetype};base64,${buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Data, {
          folder,
          resource_type: options.resource_type || 'image',
          transformation: options.transformation || [{ quality: 'auto', fetch_format: 'auto' }],
          ...options
        });
        return optimizeCloudinaryUrl(result.secure_url);
      } catch (err) {
        console.warn('Cloudinary upload error, falling back to local server disk:', err.message);
      }
    }

    // Default: Save directly to your server's disk (/uploads/...)
    return saveLocally(buffer, mimetype, folder);
  }

  return null;
};

/**
 * Upload multiple files in parallel
 */
const uploadMultipleImages = async (files, options = {}) => {
  if (!Array.isArray(files) || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadImage(file, options)));
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadImage,
  uploadMultipleImages,
  optimizeCloudinaryUrl,
  saveLocally,
  saveBase64Locally
};
