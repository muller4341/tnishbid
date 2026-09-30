const prisma = require('../prismaClient');

exports.getItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
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
    res.json(item);
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
      const fileUrls = req.files.map(f => {
        const b64 = Buffer.from(f.buffer).toString('base64');
        return `data:${f.mimetype};base64,${b64}`;
      });
      image_url = fileUrls[0];
      itemImages = [...itemImages, ...fileUrls];
    } else if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      image_url = `data:${req.file.mimetype};base64,${b64}`;
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
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        status: 'active'
      }
    });
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
      const fileUrls = req.files.map(f => {
        const b64 = Buffer.from(f.buffer).toString('base64');
        return `data:${f.mimetype};base64,${b64}`;
      });
      image_url = fileUrls[0];
      itemImages = [...itemImages, ...fileUrls];
    } else if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      image_url = `data:${req.file.mimetype};base64,${b64}`;
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
        start_time: start_time ? new Date(start_time) : existing.start_time,
        end_time: end_time ? new Date(end_time) : existing.end_time,
        status: status !== undefined ? status : existing.status,
        image_url,
        images: itemImages
      }
    });

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

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
