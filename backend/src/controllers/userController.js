const prisma = require('../prismaClient');
const { uploadImage } = require('../utils/cloudinary');

exports.getProfile = async (req, res) => {
  try {
    const [user, totalBids, auctionsWon, activeBids] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, phone_number: true, email: true, wallet_balance: true, role: true, image_url: true, created_at: true }
      }),
      prisma.bid.count({ where: { user_id: req.user.id } }),
      prisma.item.count({ where: { winner_id: req.user.id } }),
      prisma.bid.groupBy({
        by: ['item_id'],
        where: { 
          user_id: req.user.id,
          item: { status: 'active' }
        }
      })
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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

exports.updateAvatar = async (req, res) => {
  try {
    let image_url = req.body.image_url;
    
    if (req.file) {
      image_url = await uploadImage(req.file, { folder: 'tinishbid/avatars' });
    } else if (image_url) {
      image_url = await uploadImage(image_url, { folder: 'tinishbid/avatars' });
    }

    if (!image_url) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { image_url },
      select: { id: true, name: true, phone_number: true, email: true, image_url: true, wallet_balance: true }
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addFunds = async (req, res) => {
  try {
    const { amount, method, transaction_id, phone_number } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid amount' });
    }

    const cleanTxn = String(transaction_id || '').trim();
    if (!cleanTxn) {
      return res.status(400).json({ error: 'Please provide a valid transaction reference' });
    }

    // Format validation to prevent fake random strings
    if (method === 'cbe') {
      const isCbeFormat = /^FT[A-Za-z0-9]{8,18}$/i.test(cleanTxn) || /^\d{10,20}$/.test(cleanTxn);
      if (!isCbeFormat) {
        return res.status(400).json({
          error: "Invalid CBE reference. CBE FT codes typically start with 'FT' (e.g. FT261099824) from your SMS receipt."
        });
      }
    } else {
      // Telebirr
      const isTelebirrFormat = /^(TB|tb)?[A-Za-z0-9]{8,18}$/i.test(cleanTxn) && cleanTxn.length >= 8;
      if (!isTelebirrFormat) {
        return res.status(400).json({
          error: "Invalid Telebirr reference. Must be a valid 8+ character transaction ID from your Telebirr SMS."
        });
      }
    }

    // Check if this transaction reference has already been credited
    const alreadyCredited = await prisma.notification.findFirst({
      where: {
        message: { contains: cleanTxn }
      }
    });

    if (alreadyCredited) {
      return res.status(400).json({
        error: `Transaction reference '${cleanTxn}' has already been used and credited. Duplicate claims are not permitted.`
      });
    }

    const methodName = method === 'cbe' ? 'CBE Birr / CBE' : 'Telebirr';

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { wallet_balance: { increment: parsedAmount } },
      select: { id: true, name: true, phone_number: true, wallet_balance: true }
    });

    const refText = ` (Txn: ${cleanTxn})`;
    try {
      await prisma.notification.create({
        data: {
          user_id: req.user.id,
          message: `Deposit Successful! ${parsedAmount.toFixed(2)} Birr credited to your wallet via ${methodName}${refText}.`
        }
      });
    } catch (notifErr) {
      console.warn('Could not create notification log:', notifErr.message);
    }

    if (req.io) {
      req.io.to(`user_${req.user.id}`).emit('wallet_updated', {
        wallet_balance: updatedUser.wallet_balance,
        added: parsedAmount,
        method: methodName,
        transaction_id
      });
    }

    res.json({
      success: true,
      wallet_balance: updatedUser.wallet_balance,
      user: updatedUser,
      message: `${parsedAmount.toFixed(2)} Birr added to your wallet successfully!`
    });
  } catch (err) {
    console.error('addFunds error:', err);
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

const { getUserPreferences, setUserPreferences } = require('../utils/preferenceStore');

exports.getNotificationPreferences = async (req, res) => {
  try {
    const prefs = getUserPreferences(req.user.id);
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { bidDrops, wins } = req.body;
    const updated = setUserPreferences(req.user.id, {
      ...(bidDrops !== undefined ? { bidDrops: Boolean(bidDrops) } : {}),
      ...(wins !== undefined ? { wins: Boolean(wins) } : {})
    });
    res.json({ success: true, preferences: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserPreferences = getUserPreferences;
