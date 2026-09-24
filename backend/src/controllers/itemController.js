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
          orderBy: { amount: 'asc' }
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
    const { title, description, category, pool_type, base_price, start_time, end_time } = req.body;
    let image_url = '';
    
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const item = await prisma.item.create({
      data: {
        title,
        description,
        category: category || 'Electronics',
        pool_type: pool_type || 'open',
        image_url,
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
    const { title, description, category, pool_type, base_price, start_time, end_time, status } = req.body;
    
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    let image_url = existing.image_url;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? category : existing.category,
        pool_type: pool_type !== undefined ? pool_type : existing.pool_type,
        base_price: base_price !== undefined ? parseFloat(base_price) : existing.base_price,
        start_time: start_time ? new Date(start_time) : existing.start_time,
        end_time: end_time ? new Date(end_time) : existing.end_time,
        status: status !== undefined ? status : existing.status,
        image_url
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
