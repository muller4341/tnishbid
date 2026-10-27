const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { sendSms } = require('../utils/smsService');

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
        wallet_balance: 10.0
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

// In-memory OTP store for password reset: phone -> { otp, expiresAt, verified }
const resetOtpStore = new Map();

const cleanExpiredOtps = () => {
  const now = Date.now();
  for (const [phone, data] of resetOtpStore.entries()) {
    if (data.expiresAt < now) {
      resetOtpStore.delete(phone);
    }
  }
};

exports.sendResetOtp = async (req, res) => {
  try {
    const { phone_number } = req.body;
    const trimmedPhone = (phone_number || '').trim();

    if (!PHONE_REGEX.test(trimmedPhone)) {
      return res.status(400).json({
        error: 'Phone number must start with 09 or 07 followed by 8 digits (e.g., 0912345678 or 0712345678)'
      });
    }

    const user = await prisma.user.findUnique({ where: { phone_number: trimmedPhone } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this phone number' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    cleanExpiredOtps();
    resetOtpStore.set(trimmedPhone, {
      otp,
      expiresAt,
      verified: false
    });

    const smsMessage = `ትንሽBid: Your password reset verification code is ${otp}. Valid for 10 minutes.`;
    const smsResult = await sendSms(trimmedPhone, smsMessage);

    res.json({
      success: true,
      message: smsResult.success
        ? `SMS verification code sent to ${trimmedPhone}`
        : `AfroMessage (Sandbox): Contact not verified yet in your dashboard. Test code provided below.`,
      simulatedOtp: (!smsResult.success || smsResult.simulated) ? otp : undefined,
      expiresInSeconds: 600,
      deliveredViaSms: smsResult.success,
      afroMessageWarning: smsResult.error || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { phone_number, otp } = req.body;
    const trimmedPhone = (phone_number || '').trim();
    const cleanOtp = (otp || '').trim();

    const record = resetOtpStore.get(trimmedPhone);
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired or was not requested. Please request a new code.' });
    }

    if (record.otp !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your SMS and try again.' });
    }

    record.verified = true;
    resetOtpStore.set(trimmedPhone, record);

    const resetToken = jwt.sign(
      { phone_number: trimmedPhone, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Code verified successfully',
      resetToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone_number, resetToken, newPassword } = req.body;
    const trimmedPhone = (phone_number || '').trim();

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    try {
      const decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.phone_number !== trimmedPhone || decoded.purpose !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid or expired reset session. Please try again.' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Reset session expired. Please request a new code.' });
    }

    const record = resetOtpStore.get(trimmedPhone);
    if (!record || !record.verified) {
      return res.status(400).json({ error: 'Phone number has not completed SMS verification' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { phone_number: trimmedPhone },
      data: { password_hash }
    });

    resetOtpStore.delete(trimmedPhone);

    res.json({
      success: true,
      message: 'Password has been successfully reset! You can now log in.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

