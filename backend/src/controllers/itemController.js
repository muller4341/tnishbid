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
    const { title, description, base_price, start_time, end_time } = req.body;
    let image_url = '';
    
    if (req.file) {
      image_url = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const item = await prisma.item.create({
      data: {
        title,
        description,
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
