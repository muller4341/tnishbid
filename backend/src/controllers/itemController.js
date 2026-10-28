const prisma = require('../prismaClient');
const { uploadImage, uploadMultipleImages, optimizeCloudinaryUrl } = require('../utils/cloudinary');
const cache = require('../utils/cache');

const invalidateItemCache = (id) => {
  cache.del('items:all');
  if (id) {
    cache.del(`item:${id}`);
  }
};
exports.invalidateItemCache = invalidateItemCache;

// Anchors naive date strings to East Africa Time (Nairobi / Addis Ababa, UTC+3)
const parseToEAT = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (/Z|[+-]\d{2}(:?\d{2})?$/i.test(str)) {
    return new Date(str);
  }
  return new Date(`${str.replace(' ', 'T')}+03:00`);
};

exports.getItems = async (req, res) => {
  try {
    const cached = cache.get('items:all');
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
      return res.json(cached);
    }

    const items = await prisma.item.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { bids: true }
        }
      }
    });

    const optimizedItems = items.map((item) => ({
      ...item,
      image_url: optimizeCloudinaryUrl(item.image_url),
      images: Array.isArray(item.images) ? item.images.map(optimizeCloudinaryUrl) : item.images
    }));

    cache.set('items:all', optimizedItems, 45); // Cache for 45 seconds with instant invalidation on updates
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
    res.json(optimizedItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cacheKey = `item:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        winner: {
          select: { id: true, name: true, phone_number: true }
        },
        _count: {
          select: { bids: true }
        },
        bids: {
          include: {
            user: {
              select: { id: true, name: true, phone_number: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const optimizedItem = {
      ...item,
      image_url: optimizeCloudinaryUrl(item.image_url),
      images: Array.isArray(item.images) ? item.images.map(optimizeCloudinaryUrl) : item.images
    };

    cache.set(cacheKey, optimizedItem, 8); // Cache for 8 seconds
    res.setHeader('X-Cache', 'MISS');
    res.json(optimizedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { title, description, category, pool_type, is_lub, base_price, start_time, end_time, images } = req.body;
    let image_url = '';
    let itemImages = [];

    if (Array.isArray(images)) {
      itemImages = images;
    } else if (typeof images === 'string') {
      try {
        itemImages = JSON.parse(images);
      } catch {
        itemImages = images.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedUrls = await uploadMultipleImages(req.files, { folder: 'tinishbid/items' });
      const validUrls = uploadedUrls.filter(Boolean);
      if (validUrls.length > 0) {
        image_url = validUrls[0];
        itemImages = [...itemImages, ...validUrls];
      }
    } else if (req.file) {
      const uploadedUrl = await uploadImage(req.file, { folder: 'tinishbid/items' });
      if (uploadedUrl) {
        image_url = uploadedUrl;
        itemImages = [...itemImages, uploadedUrl];
      }
    }

    // Also upload any base64 images passed in the body
    if (itemImages.length > 0) {
      itemImages = (await uploadMultipleImages(itemImages, { folder: 'tinishbid/items' })).filter(Boolean);
    }

    if (!image_url && itemImages.length > 0) {
      image_url = itemImages[0];
    }

    const isLubBool = is_lub === true || is_lub === 'true' || pool_type === 'lub' || pool_type === 'premium';

    const item = await prisma.item.create({
      data: {
        title,
        description,
        category: category || 'Electronics',
        is_lub: isLubBool,
        pool_type: isLubBool ? 'lub' : 'open',
        image_url,
        images: itemImages,
        base_price: parseFloat(base_price),
        start_time: parseToEAT(start_time),
        end_time: parseToEAT(end_time),
        status: 'active'
      }
    });
    invalidateItemCache();

    // Broadcast new bid post event & notify users who enabled "New Bid Post" (bidDrops)
    if (req.io) {
      req.io.emit('new_bid_post', {
        item_id: item.id,
        title: item.title,
        category: item.category,
        image_url: item.image_url,
        base_price: item.base_price,
        message: `New Bid Post: "${item.title}" is now open for bidding!`
      });
    }

    try {
      const { getUserPreferences } = require('../utils/preferenceStore');
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      const notifData = allUsers
        .filter(u => getUserPreferences(u.id).bidDrops !== false)
        .map(u => ({
          user_id: u.id,
          message: `New Bid Post: "${item.title}" is now open for bidding!`
        }));

      if (notifData.length > 0) {
        await prisma.notification.createMany({ data: notifData });
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch new bid post notifications:', notifErr.message);
    }

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, category, pool_type, is_lub, base_price, start_time, end_time, status, images } = req.body;
    
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    let image_url = existing.image_url;
    let itemImages = existing.images || [];

    if (images !== undefined) {
      if (Array.isArray(images)) {
        itemImages = images;
      } else if (typeof images === 'string') {
        try {
          itemImages = JSON.parse(images);
        } catch {
          itemImages = images.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedUrls = await uploadMultipleImages(req.files, { folder: 'tinishbid/items' });
      const validUrls = uploadedUrls.filter(Boolean);
      if (validUrls.length > 0) {
        image_url = validUrls[0];
        itemImages = [...itemImages, ...validUrls];
      }
    } else if (req.file) {
      const uploadedUrl = await uploadImage(req.file, { folder: 'tinishbid/items' });
      if (uploadedUrl) {
        image_url = uploadedUrl;
        itemImages = [...itemImages, uploadedUrl];
      }
    }

    // Also upload any base64 images passed in the body
    if (itemImages.length > 0) {
      itemImages = (await uploadMultipleImages(itemImages, { folder: 'tinishbid/items' })).filter(Boolean);
    }

    if (!image_url && itemImages.length > 0) {
      image_url = itemImages[0];
    }

    const isLubBool = is_lub !== undefined 
      ? (is_lub === true || is_lub === 'true')
      : (pool_type !== undefined ? (pool_type === 'lub' || pool_type === 'premium') : existing.is_lub);

    const updated = await prisma.item.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? category : existing.category,
        is_lub: isLubBool,
        pool_type: isLubBool ? 'lub' : 'open',
        base_price: base_price !== undefined ? parseFloat(base_price) : existing.base_price,
        start_time: start_time ? parseToEAT(start_time) : existing.start_time,
        end_time: end_time ? parseToEAT(end_time) : existing.end_time,
        status: status !== undefined ? status : existing.status,
        image_url,
        images: itemImages
      }
    });

    invalidateItemCache(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    // Delete dependent bids first
    await prisma.bid.deleteMany({ where: { item_id: id } });
    await prisma.item.delete({ where: { id } });

    invalidateItemCache(id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
