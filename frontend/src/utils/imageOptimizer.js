/**
 * Image URL optimizer for fast loading, modern WebP/AVIF delivery, and caching.
 * Automatically injects Cloudinary transformations (f_auto, q_auto) when available.
 */

export const optimizeImageUrl = (url, { width, height, quality = 'auto' } = {}) => {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary image URL optimization
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const transformations = [];

    // Auto format (WebP / AVIF) and auto quality compression
    transformations.push(`f_auto,q_${quality}`);

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height},c_fill`);

    const transformStr = transformations.join(',');

    // Don't duplicate if already present
    if (url.includes('/image/upload/f_auto,q_auto')) {
      return url;
    }

    return url.replace('/image/upload/', `/image/upload/${transformStr}/`);
  }

  return url;
};

export default optimizeImageUrl;
