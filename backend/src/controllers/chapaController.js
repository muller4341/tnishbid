const prisma = require('../prismaClient');
const bidController = require('./bidController');

const CHAPA_INITIALIZE_URL = 'https://api.chapa.co/v1/transaction/initialize';
const CHAPA_VERIFY_URL = 'https://api.chapa.co/v1/transaction/verify';

const formatChapaError = (value) => {
  if (!value) return 'Chapa request failed';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return 'Chapa returned an unreadable error';
  }
};

const normalizeEmail = (email) => {
  const value = String(email || '').trim().toLowerCase();
  return /^[^\s@]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value) ? value : null;
};

const getConfig = () => {
  if (!process.env.CHAPA_SECRET_KEY) {
    throw new Error('CHAPA_SECRET_KEY is not configured on the server');
  }
  if (!process.env.CHAPA_CALLBACK_URL && !process.env.BACKEND_PUBLIC_URL) {
    throw new Error('Set CHAPA_CALLBACK_URL or BACKEND_PUBLIC_URL on the server');
  }
  return {
    secretKey: process.env.CHAPA_SECRET_KEY,
    callbackUrl: process.env.CHAPA_CALLBACK_URL || `${process.env.BACKEND_PUBLIC_URL}/api/payments/chapa/callback`,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  };
};

const chapaRequest = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === 'failed') {
    const error = new Error(formatChapaError(payload.message || payload.error || payload));
    error.statusCode = response.status;
    error.chapaPayload = payload;
    throw error;
  }
  return payload;
};

const redirectToResult = (res, status, txRef, message) => {
  const { frontendUrl } = getConfig();
  const params = new URLSearchParams({ status, tx_ref: txRef });
  if (message) params.set('message', message);
  return res.redirect(`${frontendUrl}/payment-result?${params.toString()}`);
};

exports.initializeBidPayment = async (req, res) => {
  const { item_id, amount } = req.body;
  const userId = req.user.id;

  try {
    const config = getConfig();
    const parsedBidAmount = parseFloat(amount);
    const itemId = parseInt(item_id, 10);
    if (!Number.isInteger(itemId) || !Number.isFinite(parsedBidAmount) || parsedBidAmount <= 0) {
      return res.status(400).json({ error: 'A valid item and bid amount are required' });
    }

    const [item, user] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'active') return res.status(400).json({ error: 'Auction is not active' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const bidFee = item.base_price != null ? item.base_price : 1.00;
    const txRef = `tinish-bid-${userId}-${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nameParts = (user.name || 'Tinish Bid User').trim().split(/\s+/);
    const phone = String(user.phone_number || '').replace(/\s+/g, '');

    await prisma.chapaPayment.create({
      data: {
        tx_ref: txRef,
        amount: bidFee,
        bid_amount: parsedBidAmount,
        status: 'pending',
        user_id: userId,
        item_id: itemId
      }
    });

    const chapaPayload = {
      amount: bidFee.toFixed(2),
      currency: 'ETB',
      email: normalizeEmail(process.env.CHAPA_DEFAULT_EMAIL) || 'payments@tinishbid.com',
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(' ') || nameParts[0],
      tx_ref: txRef,
      callback_url: config.callbackUrl,
      return_url: config.callbackUrl,
      customization: {
        title: 'TinishBid fee',
        description: `Bid fee for ${item.title}`
      }
    };
    if (/^(09|07)\d{8}$/.test(phone)) chapaPayload.phone_number = phone;

    const chapaResponse = await chapaRequest(CHAPA_INITIALIZE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chapaPayload)
    });

    res.json({ tx_ref: txRef, checkout_url: chapaResponse.data?.checkout_url });
  } catch (error) {
    console.error('Chapa initialization error:', {
      statusCode: error.statusCode,
      message: error.message,
      cause: error.cause?.message,
      causeCode: error.cause?.code,
      response: error.chapaPayload
    });
    res.status(502).json({ error: error.message });
  }
};

exports.prepareInlineBidPayment = async (req, res) => {
  const { item_id, amount } = req.body;
  const userId = req.user.id;

  try {
    const parsedBidAmount = parseFloat(amount);
    const itemId = parseInt(item_id, 10);
    if (!Number.isInteger(itemId) || !Number.isFinite(parsedBidAmount) || parsedBidAmount <= 0) {
      return res.status(400).json({ error: 'A valid item and bid amount are required' });
    }

    const [item, user] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'active') return res.status(400).json({ error: 'Auction is not active' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const txRef = `tinish-inline-${userId}-${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bidFee = item.base_price != null ? item.base_price : 1.00;
    await prisma.chapaPayment.create({
      data: { tx_ref: txRef, amount: bidFee, bid_amount: parsedBidAmount, status: 'pending', user_id: userId, item_id: itemId }
    });

    res.json({ tx_ref: txRef, amount: bidFee });
  } catch (error) {
    console.error('Inline Chapa preparation error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.completeInlineBidPayment = async (req, res) => {
  const { tx_ref: txRef, chapa_ref: chapaRef } = req.body;
  const userId = req.user.id;
  if (!txRef) return res.status(400).json({ error: 'Missing payment reference' });

  try {
    const config = getConfig();
    const payment = await prisma.chapaPayment.findUnique({ where: { tx_ref: txRef } });
    if (!payment || payment.user_id !== userId) return res.status(404).json({ error: 'Payment record not found' });
    if (payment.status === 'completed') return res.json({ status: 'success' });

    const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(chapaRef || txRef)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}` }
    });
    const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
    const verifiedAmount = Number(verified.data?.amount);
    if (verifiedStatus !== 'success' || (Number.isFinite(verifiedAmount) && Math.abs(verifiedAmount - payment.amount) > 0.001)) {
      return res.status(400).json({ error: 'Chapa payment could not be verified' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.chapaPayment.findUnique({ where: { tx_ref: txRef } });
      if (!currentPayment) throw new Error('Payment record not found');
      if (currentPayment.status === 'completed') return null;
      const bid = await bidController.createBidRecord(tx, {
        itemId: currentPayment.item_id,
        userId: currentPayment.user_id,
        amount: currentPayment.bid_amount,
        io: req.io
      });
      await tx.chapaPayment.update({
        where: { tx_ref: txRef },
        data: { status: 'completed', chapa_ref: chapaRef || null }
      });
      return bid;
    });

    if (result) req.io.emit('bid_update', { item_id: payment.item_id, new_bid_amount: result.amount, is_unique: result.is_unique });
    res.json({ status: 'success', bid: result });
  } catch (error) {
    console.error('Inline Chapa completion error:', error.message);
    res.status(502).json({ error: error.message });
  }
};

exports.handleCallback = async (req, res) => {
  const txRef = req.query.tx_ref || req.query.trx_ref;
  if (!txRef) return redirectToResult(res, 'failed', '', 'Missing Chapa transaction reference');

  try {
    const config = getConfig();
    const payment = await prisma.chapaPayment.findUnique({ where: { tx_ref: txRef } });
    if (!payment) return redirectToResult(res, 'failed', txRef, 'Payment record not found');
    if (payment.status === 'completed') return redirectToResult(res, 'success', txRef);

    const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}` }
    });
    const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
    if (verifiedStatus !== 'success') {
      await prisma.chapaPayment.update({ where: { tx_ref: txRef }, data: { status: 'failed' } });
      return redirectToResult(res, 'failed', txRef, 'Chapa payment was not successful');
    }
    const verifiedAmount = Number(verified.data?.amount);
    if (Number.isFinite(verifiedAmount) && Math.abs(verifiedAmount - payment.amount) > 0.001) {
      await prisma.chapaPayment.update({ where: { tx_ref: txRef }, data: { status: 'failed' } });
      return redirectToResult(res, 'failed', txRef, 'Chapa payment amount did not match the bid fee');
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.chapaPayment.findUnique({ where: { tx_ref: txRef } });
      if (!currentPayment) throw new Error('Payment record not found');
      if (currentPayment.status === 'completed') return null;

      const bid = await bidController.createBidRecord(tx, {
        itemId: currentPayment.item_id,
        userId: currentPayment.user_id,
        amount: currentPayment.bid_amount,
        io: req.io
      });
      await tx.chapaPayment.update({
        where: { tx_ref: txRef },
        data: { status: 'completed', chapa_ref: verified.data?.ref_id || verified.data?.transaction_id || null }
      });
      return bid;
    });

    if (result) {
      req.io.emit('bid_update', {
        item_id: payment.item_id,
        new_bid_amount: result.amount,
        is_unique: result.is_unique
      });
    }
    return redirectToResult(res, 'success', txRef);
  } catch (error) {
    console.error('Chapa callback error:', error.message);
    return redirectToResult(res, 'failed', txRef, error.message);
  }
};
