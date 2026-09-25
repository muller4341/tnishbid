const prisma = require('../prismaClient');

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, phone_number: true, email: true, wallet_balance: true, role: true, created_at: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalBids = await prisma.bid.count({ where: { user_id: req.user.id } });
    const auctionsWon = await prisma.item.count({ where: { winner_id: req.user.id } });
    const activeBids = await prisma.bid.groupBy({
      by: ['item_id'],
      where: { 
        user_id: req.user.id,
        item: { status: 'active' }
      }
    });

    res.json({
      ...user,
      totalBids,
      auctionsWon,
      activePools: activeBids.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { wallet_balance: { increment: amount } },
      select: { id: true, name: true, wallet_balance: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), user_id: req.user.id },
      data: { is_read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
