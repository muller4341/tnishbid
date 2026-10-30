const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
    timeout: 120000
  });
}

/**
 * Uploads a file buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} mimetype - File mimetype
 * @param {Object} options - Cloudinary upload options (e.g. folder)
 * @returns {Promise<string>} - Resolves to secure_url
 */
const uploadBufferToCloudinary = async (buffer, mimetype = 'image/jpeg', options = {}) => {
  if (!isConfigured) {
    console.warn('Cloudinary is not configured. Falling back to data URI.');
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }

  const base64Data = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: options.folder || 'tinishbid/items',
    resource_type: options.resource_type || 'image',
    transformation: options.transformation || [{ quality: 'auto', fetch_format: 'auto' }],
    ...options
  });
  return optimizeCloudinaryUrl(result.secure_url);
};

/**
 * Ensures a Cloudinary URL uses automatic format (WebP/AVIF) and quality optimization
 * @param {string} url - Image URL
 * @returns {string} - Optimized URL
 */
const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }
  // Check if transformation is already present
  if (url.includes('/image/upload/f_auto,q_auto/') || url.includes('/upload/f_auto,q_auto/')) {
    return url;
  }
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
};

/**
 * Universal image uploader: handles multer file object, Buffer, or data URI / URL
 * @param {Object|Buffer|string} input - Multer file, Buffer, or string (base64 or url)
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - Cloudinary secure URL
 */
const uploadImage = async (input, options = {}) => {
  if (!input) return null;

  // If already a remote URL, return optimized URL
  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return optimizeCloudinaryUrl(input);
    }
    if (input.startsWith('data:')) {
      if (!isConfigured) return input;
      const result = await cloudinary.uploader.upload(input, {
        folder: options.folder || 'tinishbid/items',
        resource_type: options.resource_type || 'image',
        transformation: options.transformation || [{ quality: 'auto', fetch_format: 'auto' }],
        ...options
      });
      return optimizeCloudinaryUrl(result.secure_url);
    }
    return input;
  }

  // Multer file object
  if (input.buffer && Buffer.isBuffer(input.buffer)) {
    return uploadBufferToCloudinary(input.buffer, input.mimetype || 'image/jpeg', options);
  }

  // Raw Buffer
  if (Buffer.isBuffer(input)) {
    return uploadBufferToCloudinary(input, options.mimetype || 'image/jpeg', options);
  }

  return null;
};

/**
 * Upload multiple files to Cloudinary in parallel
 * @param {Array} files - Array of multer files or image strings
 * @param {Object} options - Upload options
 * @returns {Promise<string[]>}
 */
const uploadMultipleImages = async (files, options = {}) => {
  if (!Array.isArray(files) || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadImage(file, options)));
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadBufferToCloudinary,
  uploadImage,
  uploadMultipleImages,
  optimizeCloudinaryUrl
};
