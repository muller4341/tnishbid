const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

const PHONE_REGEX = /^(09|07)\d{8}$/;

exports.register = async (req, res) => {
  try {
    const { name, phone_number, password, email } = req.body;

    const trimmedPhone = (phone_number || '').trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      return res.status(400).json({
        error: 'Phone number must start with 09 or 07 followed by 8 digits (e.g., 0912345678 or 0712345678)'
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone_number: trimmedPhone } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name || trimmedPhone,
        phone_number: trimmedPhone,
        email: email || null,
        password_hash,
        wallet_balance: 100.0
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        wallet_balance: user.wallet_balance,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone_number, password } = req.body;

    const trimmedPhone = (phone_number || '').trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      return res.status(400).json({
        error: 'Phone number must start with 09 or 07 followed by 8 digits (e.g., 0912345678 or 0712345678)'
      });
    }

    const user = await prisma.user.findUnique({ where: { phone_number: trimmedPhone } });
    if (!user) return res.status(400).json({ error: 'Invalid phone number or password' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid phone number or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        email: user.email,
        wallet_balance: user.wallet_balance,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
