const prisma = require('../prismaClient');
const bidController = require('./bidController');
const { invalidateItemCache } = require('./itemController');
const { isAuctionEndedBackend } = require('../utils/dateHelper');

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

const normalizePhone = (phone, fallbackPhone) => {
  const input = phone || fallbackPhone || '';
  let raw = String(input).replace(/\D/g, '');
  if (raw.startsWith('251')) raw = '0' + raw.slice(3);
  if (!raw.startsWith('0') && (raw.startsWith('9') || raw.startsWith('7'))) raw = '0' + raw;
  return raw || (fallbackPhone ? String(fallbackPhone) : null);
};

const normalizePaymentMethod = (method, fallback = 'telebirr') => {
  const m = String(method || '').toLowerCase();
  if (m.includes('cbe')) return 'cbe';
  if (m.includes('telebirr') || m.includes('tele')) return 'telebirr';
  if (m.includes('wallet')) return 'wallet';
  if (m.includes('chapa')) return 'chapa';
  return fallback;
};

const extractItemIdFromTxRef = (ref, fallbackId) => {
  if (fallbackId) {
    const num = parseInt(fallbackId, 10);
    if (!isNaN(num) && num > 0) return num;
  }
  if (!ref || typeof ref !== 'string') return null;
  const parts = ref.split('-');
  if (parts.length >= 4) {
    const parsed = parseInt(parts[3], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const KNOWN_SECRET_KEYS = [
  (process.env.CHAPA_SECRET_KEY || '').trim(),
  'CHASECK-tM93dX4JwoCsV2kKlaXpBVgraUUuhIbM',
  'CHASECK-Ryg9wi0dyiyB1N3mm63LsOBY9iXcw2SI'
].filter(k => k && k.startsWith('CHASECK-'));

const getConfig = () => {
  const envKey = (process.env.CHAPA_SECRET_KEY || '').trim();
  const secretKey = envKey.startsWith('CHASECK-') ? envKey : 'CHASECK-tM93dX4JwoCsV2kKlaXpBVgraUUuhIbM';
  return {
    secretKey,
    callbackUrl: process.env.CHAPA_CALLBACK_URL || `${process.env.BACKEND_PUBLIC_URL || 'https://tinishbid.com'}/api/payments/chapa/callback`,
    frontendUrl: process.env.FRONTEND_URL || 'https://tinishbid.com'
  };
};

const chapaRequest = async (url, options = {}) => {
  const tryKeys = [...new Set(KNOWN_SECRET_KEYS.length > 0 ? KNOWN_SECRET_KEYS : ['CHASECK-tM93dX4JwoCsV2kKlaXpBVgraUUuhIbM'])];
  let lastError = null;

  for (const key of tryKeys) {
    const opts = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${key}`
      }
    };
    try {
      const response = await fetch(url, opts);
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.status !== 'failed') {
        return payload;
      }
      const errMsg = formatChapaError(payload.message || payload.error || payload);
      if (errMsg.toLowerCase().includes('api key') && tryKeys.indexOf(key) < tryKeys.length - 1) {
        lastError = new Error(errMsg);
        continue;
      }
      const error = new Error(errMsg);
      error.statusCode = response.status;
      error.chapaPayload = payload;
      throw error;
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('api key') && tryKeys.indexOf(key) < tryKeys.length - 1) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('Chapa request failed');
};

const redirectToResult = (res, status, txRef, message) => {
  const { frontendUrl } = getConfig();
  const params = new URLSearchParams({ status, tx_ref: txRef });
  if (message) params.set('message', message);
  return res.redirect(`${frontendUrl}/payment-result?${params.toString()}`);
};

const finalizeBidPaymentRecord = async ({ txRef, verifiedChapaRef, phone, paymentMethod, fallbackItemId, io }) => {
  const payment = await prisma.transaction.findUnique({ where: { tx_ref: txRef } });
  if (!payment) throw new Error(`Payment record with ref ${txRef} not found`);
  if (payment.status === 'completed') return { already_completed: true, payment };

  const targetItemId = extractItemIdFromTxRef(txRef, fallbackItemId);
  if (!targetItemId) throw new Error('Auction item could not be determined from transaction');

  const item = await prisma.item.findUnique({ where: { id: targetItemId } });
  const hasEnded = !item || item.status !== 'active' || isAuctionEndedBackend(item?.end_time);

  if (hasEnded) {
    // Auction closed before payment completed: refund the bid fee to user wallet
    const refundedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: payment.user_id },
        data: { wallet_balance: { increment: payment.amount } }
      });
      await tx.transaction.update({
        where: { tx_ref: txRef },
        data: {
          status: 'refunded_to_wallet',
          chapa_ref: verifiedChapaRef || payment.chapa_ref || null,
          ...(phone ? { paid_phone: normalizePhone(phone, payment.paid_phone) } : {})
        }
      });
      await tx.notification.create({
        data: {
          user_id: payment.user_id,
          message: `The auction for "${item?.title || 'the item'}" ended before payment was confirmed. ${payment.amount.toFixed(2)} Birr has been credited back to your wallet.`,
          notification_type: 'deposit'
        }
      });
      return u;
    });

    if (io) {
      io.to(`user_${payment.user_id}`).emit('wallet_updated', {
        wallet_balance: refundedUser.wallet_balance,
        added: payment.amount,
        message: 'Auction ended. Fee refunded to your wallet.'
      });
    }

    return {
      status: 'refunded_to_wallet',
      message: `Auction ended. Refunded ${payment.amount.toFixed(2)} Birr to user wallet.`,
      user_id: payment.user_id,
      amount: payment.amount
    };
  }

  // Active auction: create bid record
  const result = await prisma.$transaction(async (tx) => {
    const currentPayment = await tx.transaction.findUnique({ where: { tx_ref: txRef } });
    if (!currentPayment) throw new Error('Payment record not found');
    if (currentPayment.status === 'completed') return null;

    const bid = await bidController.createBidRecord(tx, {
      itemId: targetItemId,
      userId: currentPayment.user_id,
      amount: currentPayment.bid_amount,
      transactionId: currentPayment.id,
      io
    });

    const updateData = {
      status: 'completed',
      chapa_ref: verifiedChapaRef || currentPayment.chapa_ref || null
    };
    if (phone || !currentPayment.paid_phone) {
      updateData.paid_phone = normalizePhone(phone, currentPayment.paid_phone);
    }
    if (paymentMethod || currentPayment.payment_method === 'chapa') {
      updateData.payment_method = normalizePaymentMethod(paymentMethod, currentPayment.payment_method || 'telebirr');
    }

    await tx.transaction.update({
      where: { tx_ref: txRef },
      data: updateData
    });

    return bid;
  });

  if (result) {
    invalidateItemCache(targetItemId);
    if (io) {
      io.emit('bid_update', {
        item_id: Number(targetItemId),
        new_bid_amount: result.amount,
        is_unique: result.is_unique,
        total_bids: result.total_bids,
        bid: result
      });
    }
  }

  return { status: 'success', bid: result };
};

const finalizeWalletDepositRecord = async ({ txRef, verifiedAmount, chapaRef, phone, method, io }) => {
  const existingTx = await prisma.transaction.findUnique({ where: { tx_ref: txRef } });
  if (existingTx && existingTx.status === 'completed') {
    return { already_completed: true, existingTx };
  }

  const parts = txRef.split('-');
  const userId = existingTx?.user_id || parts[2] || (parts[0] === 'tw' ? parts[1] : null);
  if (!userId) {
    throw new Error(`Could not determine user ID from reference ${txRef}`);
  }

  const amountToCredit = Number.isFinite(verifiedAmount) && verifiedAmount > 0 
    ? verifiedAmount 
    : Number(existingTx?.amount || 0);

  if (!amountToCredit || amountToCredit <= 0) {
    throw new Error(`Invalid deposit amount for ${txRef}`);
  }

  const normMethod = normalizePaymentMethod(
    method || existingTx?.payment_method || (txRef.includes('cbe') ? 'cbe' : 'telebirr'),
    'telebirr'
  );
  const methodName = normMethod === 'cbe' ? 'CBE Birr' : 'Telebirr';

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { wallet_balance: { increment: amountToCredit } },
      select: { id: true, name: true, phone_number: true, wallet_balance: true }
    });

    const finalPaidPhone = normalizePhone(phone, existingTx?.paid_phone || user.phone_number);

    await tx.transaction.upsert({
      where: { tx_ref: txRef },
      create: {
        tx_ref: txRef,
        amount: amountToCredit,
        status: 'completed',
        payment_method: normMethod,
        payment_type: 'deposit',
        paid_phone: finalPaidPhone,
        user_id: userId,
        chapa_ref: chapaRef || null
      },
      update: {
        status: 'completed',
        amount: amountToCredit,
        payment_method: normMethod,
        payment_type: 'deposit',
        ...(finalPaidPhone ? { paid_phone: finalPaidPhone } : {}),
        chapa_ref: chapaRef || null
      }
    });

    await tx.notification.create({
      data: {
        user_id: userId,
        message: `Deposit Successful! ${amountToCredit.toFixed(2)} Birr credited to your wallet via ${methodName} (Txn: ${txRef}).`,
        notification_type: 'deposit'
      }
    });

    return user;
  });

  if (io) {
    io.to(`user_${userId}`).emit('wallet_updated', {
      wallet_balance: updatedUser.wallet_balance,
      added: amountToCredit,
      method: methodName,
      transaction_id: txRef
    });
  }

  return { success: true, updatedUser };
};

exports.initializeBidPayment = async (req, res) => {
  const { item_id, amount, phone_number, payment_method, method } = req.body;
  const userId = req.user.id;

  try {
    const config = getConfig();
    const parsedBidAmount = parseFloat(parseFloat(amount).toFixed(2));
    const itemId = parseInt(item_id, 10);
    if (!Number.isInteger(itemId) || !Number.isFinite(parsedBidAmount) || parsedBidAmount <= 0) {
      return res.status(400).json({ error: 'A valid item and positive bid amount are required' });
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
    const finalPaidPhone = normalizePhone(phone_number, user.phone_number);
    const finalMethod = normalizePaymentMethod(payment_method || method, 'telebirr');

    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: bidFee,
        bid_amount: parsedBidAmount,
        status: 'pending',
        payment_method: finalMethod,
        payment_type: 'bid_purchase',
        paid_phone: finalPaidPhone,
        user_id: userId
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
    if (finalPaidPhone && /^(09|07)\d{8}$/.test(finalPaidPhone)) chapaPayload.phone_number = finalPaidPhone;

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
  const { item_id, amount, payment_method, method, phone_number } = req.body;
  const userId = req.user.id;

  try {
    const parsedBidAmount = parseFloat(parseFloat(amount).toFixed(2));
    const itemId = parseInt(item_id, 10);
    if (!Number.isInteger(itemId) || !Number.isFinite(parsedBidAmount) || parsedBidAmount <= 0) {
      return res.status(400).json({ error: 'A valid item and positive bid amount are required' });
    }

    const [item, user] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'active') return res.status(400).json({ error: 'Auction is not active' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const finalPaidPhone = normalizePhone(phone_number, user.phone_number);
    const finalMethod = normalizePaymentMethod(payment_method || method, 'telebirr');

    const txRef = `tinish-inline-${userId}-${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bidFee = item.base_price != null ? item.base_price : 1.00;
    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: bidFee,
        bid_amount: parsedBidAmount,
        status: 'pending',
        payment_method: finalMethod,
        payment_type: 'bid_purchase',
        paid_phone: finalPaidPhone,
        user_id: userId
      }
    });

    res.json({ tx_ref: txRef, amount: bidFee, method: finalMethod, mobile: finalPaidPhone });
  } catch (error) {
    console.error('Inline Chapa preparation error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.completeInlineBidPayment = async (req, res) => {
  const { tx_ref: txRef, chapa_ref: chapaRef, item_id: bodyItemId, payment_method, method, phone_number } = req.body;
  const userId = req.user.id;
  if (!txRef) return res.status(400).json({ error: 'Missing payment reference' });

  try {
    const config = getConfig();
    const payment = await prisma.transaction.findUnique({ where: { tx_ref: txRef } });
    if (!payment || payment.user_id !== userId) return res.status(404).json({ error: 'Payment record not found' });
    if (payment.status === 'completed') return res.json({ status: 'success' });

    const targetItemId = extractItemIdFromTxRef(txRef, bodyItemId);
    if (!targetItemId) return res.status(400).json({ error: 'Target auction item could not be determined' });

    // Chapa verify endpoint expects merchant's tx_ref
    const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
      method: 'GET'
    });
    const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
    
    // If user has not yet entered PIN / approved on phone, return pending so frontend keeps polling
    if (verifiedStatus === 'pending') {
      return res.json({ status: 'pending', message: 'Waiting for payment approval on phone' });
    }

    if (verifiedStatus !== 'success') {
      const reason = verified.data?.failure_reason || 'Payment was not approved or was cancelled.';
      return res.status(400).json({ status: verifiedStatus, error: reason });
    }

    const verifiedAmount = Number(verified.data?.amount);
    if (Number.isFinite(verifiedAmount) && Math.abs(verifiedAmount - payment.amount) > 0.001) {
      return res.status(400).json({ error: 'Chapa payment amount did not match required fee' });
    }

    const verifiedChapaRef = verified.data?.reference || verified.data?.ref_id || (typeof chapaRef === 'string' ? chapaRef : null);

    const result = await finalizeBidPaymentRecord({
      txRef,
      verifiedChapaRef,
      phone: phone_number || req.user?.phone_number,
      paymentMethod: payment_method || method,
      fallbackItemId: targetItemId,
      io: req.io
    });

    if (result.status === 'refunded_to_wallet') {
      return res.json({ status: 'refunded_to_wallet', message: result.message });
    }

    res.json({ status: 'success', bid: result.bid });
  } catch (error) {
    console.error('Inline Chapa completion error:', error.message);
    res.status(502).json({ error: error.message });
  }
};

exports.prepareInlineWalletDeposit = async (req, res) => {
  const { amount, method, phone_number } = req.body;
  const userId = req.user.id;

  try {
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: 'Please enter more than 1' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const normalizedMethod = normalizePaymentMethod(method, 'telebirr');
    const finalPaidPhone = normalizePhone(phone_number, user.phone_number);
    const mTag = normalizedMethod === 'cbe' ? 'cbe' : 'tele';
    const txRef = `tw-inline-${userId}-${mTag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: parsedAmount,
        status: 'pending',
        payment_method: normalizedMethod,
        payment_type: 'deposit',
        paid_phone: finalPaidPhone,
        user_id: userId
      }
    });

    res.json({
      success: true,
      tx_ref: txRef,
      amount: parsedAmount,
      method: normalizedMethod,
      mobile: finalPaidPhone
    });
  } catch (error) {
    console.error('Inline wallet deposit preparation error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to prepare deposit' });
  }
};

exports.initializeWalletDeposit = async (req, res) => {
  const { amount, phone_number, method } = req.body;
  const userId = req.user.id;

  try {
    const config = getConfig();
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: 'Please enter more than 1' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const normalizedMethod = normalizePaymentMethod(method, 'telebirr');
    const finalPaidPhone = normalizePhone(phone_number, user.phone_number);
    const mTag = normalizedMethod === 'cbe' ? 'cbe' : 'tele';
    const txRef = `tw-${userId}-${mTag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nameParts = (user.name || 'Tinish Bid User').trim().split(/\s+/);

    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: parsedAmount,
        status: 'pending',
        payment_method: normalizedMethod,
        payment_type: 'deposit',
        paid_phone: finalPaidPhone,
        user_id: userId
      }
    });

    const chapaPayload = {
      amount: parsedAmount.toFixed(2),
      currency: 'ETB',
      email: normalizeEmail(user.email) || normalizeEmail(process.env.CHAPA_DEFAULT_EMAIL) || 'payments@tinishbid.com',
      first_name: nameParts[0] || 'User',
      last_name: nameParts.slice(1).join(' ') || nameParts[0] || 'Member',
      tx_ref: txRef,
      callback_url: config.callbackUrl,
      return_url: `${config.frontendUrl}/payment-result?status=success&tx_ref=${txRef}&type=wallet&method=${normalizedMethod}`,
      customization: {
        title: 'TinishBid',
        description: `Add ${parsedAmount} Coins via ${normalizedMethod === 'cbe' ? 'CBE Birr' : 'Telebirr'}`
      }
    };
    if (finalPaidPhone && /^(09|07)\d{8}$/.test(finalPaidPhone)) chapaPayload.phone_number = finalPaidPhone;

    const chapaResponse = await chapaRequest(CHAPA_INITIALIZE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chapaPayload)
    });

    res.json({
      success: true,
      tx_ref: txRef,
      checkout_url: chapaResponse.data?.checkout_url
    });
  } catch (error) {
    console.error('Wallet deposit initialization error:', error.message);
    res.status(502).json({ error: error.message || 'Failed to initialize deposit with Chapa' });
  }
};

exports.verifyWalletDeposit = async (req, res) => {
  const { tx_ref: txRef, method: passedMethod, payment_method: passedPaymentMethod, phone_number } = req.body;
  const userId = req.user.id;

  if (!txRef) {
    return res.status(400).json({ error: 'Missing transaction reference' });
  }

  try {
    const config = getConfig();

    // Call Chapa verify endpoint to authoritatively check with Chapa / Ethio Telecom / CBE
    const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}` }
    });

    const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
    if (verifiedStatus !== 'success') {
      return res.status(400).json({
        error: 'Payment was not verified by Chapa or was cancelled. No funds were added.'
      });
    }

    const verifiedAmount = Number(verified.data?.amount);
    if (!Number.isFinite(verifiedAmount) || verifiedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid verified payment amount' });
    }

    // Determine the real chosen payment method from request, Chapa verification data, or txRef
    const normMethod = normalizePaymentMethod(
      passedMethod ||
      passedPaymentMethod ||
      verified.data?.payment_method ||
      (txRef.toLowerCase().includes('-cbe-') || txRef.toLowerCase().includes('cbe') ? 'cbe' : '') ||
      (txRef.toLowerCase().includes('-telebirr-') || txRef.toLowerCase().includes('tele') ? 'telebirr' : ''),
      'telebirr'
    );
    const methodName = normMethod === 'cbe' ? 'CBE Birr' : 'Telebirr';

    // Check if this tx_ref has already been completed to prevent double crediting
    const existingTx = await prisma.transaction.findUnique({
      where: { tx_ref: txRef }
    });

    if (existingTx && existingTx.status === 'completed') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true }
      });
      return res.json({
        success: true,
        already_credited: true,
        wallet_balance: user.wallet_balance,
        amount: verifiedAmount,
        method: methodName,
        message: 'This deposit was already credited to your wallet.'
      });
    }

    // Atomic update: Credit user wallet and save completed transaction record
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { wallet_balance: { increment: verifiedAmount } },
        select: { id: true, name: true, phone_number: true, wallet_balance: true }
      });

      const finalPaidPhone = normalizePhone(phone_number, existingTx?.paid_phone || user.phone_number);

      await tx.transaction.upsert({
        where: { tx_ref: txRef },
        create: {
          tx_ref: txRef,
          amount: verifiedAmount,
          status: 'completed',
          payment_method: normMethod,
          payment_type: 'deposit',
          paid_phone: finalPaidPhone,
          user_id: userId,
          chapa_ref: verified.data?.reference || verified.data?.ref_id || null
        },
        update: {
          status: 'completed',
          amount: verifiedAmount,
          payment_method: normMethod,
          payment_type: 'deposit',
          ...(finalPaidPhone ? { paid_phone: finalPaidPhone } : {}),
          chapa_ref: verified.data?.reference || verified.data?.ref_id || null
        }
      });

      await tx.notification.create({
        data: {
          user_id: userId,
          message: `Deposit Successful! ${verifiedAmount.toFixed(2)} Birr credited to your wallet via ${methodName} (Txn: ${txRef}).`,
          notification_type: 'deposit'
        }
      });

      return user;
    });

    if (req.io) {
      req.io.to(`user_${userId}`).emit('wallet_updated', {
        wallet_balance: updatedUser.wallet_balance,
        added: verifiedAmount,
        method: methodName,
        transaction_id: txRef
      });
    }

    res.json({
      success: true,
      wallet_balance: updatedUser.wallet_balance,
      amount: verifiedAmount,
      method: methodName,
      transaction_id: txRef,
      message: `${verifiedAmount.toFixed(2)} Birr added to your wallet successfully via ${methodName}!`
    });
  } catch (error) {
    console.error('Wallet deposit verification error:', error.message);
    res.status(400).json({
      error: error.message || 'Payment verification failed. Please check that you completed the payment.'
    });
  }
};

exports.handleCallback = async (req, res) => {
  const txRef = req.query.tx_ref || req.query.trx_ref;
  if (!txRef) return redirectToResult(res, 'failed', '', 'Missing Chapa transaction reference');

  // Handle wallet deposit callback
  if (txRef.startsWith('tinish-wallet-') || txRef.startsWith('tinish-w-inline-') || txRef.startsWith('tw-')) {
    try {
      const config = getConfig();
      const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${config.secretKey}` }
      });
      const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
      if (verifiedStatus === 'success') {
        const verifiedAmount = Number(verified.data?.amount);
        const verifiedChapaRef = verified.data?.reference || verified.data?.ref_id || null;
        await finalizeWalletDepositRecord({
          txRef,
          verifiedAmount,
          chapaRef: verifiedChapaRef,
          io: req.io
        });
        return redirectToResult(res, 'success', txRef, 'Wallet credited successfully!');
      }
      return redirectToResult(res, 'failed', txRef, 'Payment not verified');
    } catch (err) {
      return redirectToResult(res, 'failed', txRef, err.message);
    }
  }

  try {
    const config = getConfig();
    const payment = await prisma.transaction.findUnique({ where: { tx_ref: txRef } });
    if (!payment) return redirectToResult(res, 'failed', txRef, 'Payment record not found');
    if (payment.status === 'completed') return redirectToResult(res, 'success', txRef);

    const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}` }
    });
    const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
    if (verifiedStatus !== 'success') {
      await prisma.transaction.update({ where: { tx_ref: txRef }, data: { status: 'failed' } });
      return redirectToResult(res, 'failed', txRef, 'Chapa payment was not successful');
    }
    const verifiedAmount = Number(verified.data?.amount);
    if (Number.isFinite(verifiedAmount) && Math.abs(verifiedAmount - payment.amount) > 0.001) {
      await prisma.transaction.update({ where: { tx_ref: txRef }, data: { status: 'failed' } });
      return redirectToResult(res, 'failed', txRef, 'Chapa payment amount did not match the bid fee');
    }

    const verifiedChapaRef = verified.data?.reference || verified.data?.ref_id || null;
    const result = await finalizeBidPaymentRecord({
      txRef,
      verifiedChapaRef,
      fallbackItemId: req.query.item_id,
      io: req.io
    });

    if (result.status === 'refunded_to_wallet') {
      return redirectToResult(res, 'success', txRef, result.message);
    }
    return redirectToResult(res, 'success', txRef);
  } catch (error) {
    console.error('Chapa callback error:', error.message);
    return redirectToResult(res, 'failed', txRef, error.message);
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const body = req.body || {};
    const query = req.query || {};
    const txRef = body.tx_ref || body.trx_ref || body.reference || query.tx_ref || query.trx_ref;

    if (!txRef) {
      return res.status(400).json({ error: 'Missing tx_ref in webhook request' });
    }

    console.log(`[Chapa Webhook] Received webhook notification for tx_ref: ${txRef}`);

    const config = getConfig();
    const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}` }
    });

    const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
    if (verifiedStatus !== 'success') {
      console.warn(`[Chapa Webhook] Chapa verify returned status "${verifiedStatus}" for ${txRef}`);
      return res.status(200).json({ status: 'ignored', reason: 'payment_not_successful' });
    }

    const verifiedChapaRef = verified.data?.reference || verified.data?.ref_id || body.reference || null;
    const verifiedAmount = Number(verified.data?.amount || body.amount);
    const paymentMethod = body.payment_method || verified.data?.payment_method;
    const phone = body.mobile || body.phone_number || verified.data?.mobile;

    const isWallet = txRef.startsWith('tw-') || txRef.startsWith('tinish-wallet-') || txRef.startsWith('tinish-w-');
    if (isWallet) {
      await finalizeWalletDepositRecord({
        txRef,
        verifiedAmount,
        chapaRef: verifiedChapaRef,
        phone,
        method: paymentMethod,
        io: req.io
      });
    } else {
      await finalizeBidPaymentRecord({
        txRef,
        verifiedChapaRef,
        phone,
        paymentMethod,
        io: req.io
      });
    }

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('[Chapa Webhook Error]:', error.message);
    return res.status(200).json({ error: error.message });
  }
};

exports.syncPendingChapaPayments = async (io) => {
  try {
    const config = getConfig();
    // Find transactions created in the last 4 hours that are still 'pending'
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const thirtySecsAgo = new Date(Date.now() - 25 * 1000);

    const pendingList = await prisma.transaction.findMany({
      where: {
        status: 'pending',
        created_at: {
          gte: fourHoursAgo,
          lte: thirtySecsAgo
        }
      },
      take: 30
    });

    const results = [];
    for (const tx of pendingList) {
      try {
        const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(tx.tx_ref)}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${config.secretKey}` }
        });
        const status = String(verified.data?.status || verified.status || '').toLowerCase();
        if (status === 'success') {
          console.log(`[Auto-Sync] Found completed pending payment: ${tx.tx_ref}. Processing...`);
          const verifiedChapaRef = verified.data?.reference || verified.data?.ref_id || null;
          const verifiedAmount = Number(verified.data?.amount);
          const isWallet = tx.payment_type === 'deposit' || tx.tx_ref.startsWith('tw-') || tx.tx_ref.startsWith('tinish-wallet-');

          if (isWallet) {
            await finalizeWalletDepositRecord({
              txRef: tx.tx_ref,
              verifiedAmount,
              chapaRef: verifiedChapaRef,
              phone: tx.paid_phone,
              method: tx.payment_method,
              io
            });
            results.push({ tx_ref: tx.tx_ref, type: 'wallet', status: 'completed' });
          } else {
            const res = await finalizeBidPaymentRecord({
              txRef: tx.tx_ref,
              verifiedChapaRef,
              phone: tx.paid_phone,
              paymentMethod: tx.payment_method,
              io
            });
            results.push({ tx_ref: tx.tx_ref, type: 'bid', status: res.status });
          }
        }
      } catch (err) {
        // Transaction not yet paid in Chapa, ignore
      }
    }
    return results;
  } catch (err) {
    console.error('[Sync Pending Error]:', err.message);
    return [];
  }
};

exports.syncPendingManual = async (req, res) => {
  try {
    const synced = await exports.syncPendingChapaPayments(req.io);
    res.json({ success: true, count: synced.length, synced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.finalizeBidPaymentRecord = finalizeBidPaymentRecord;
exports.finalizeWalletDepositRecord = finalizeWalletDepositRecord;
exports.chapaRequest = chapaRequest;
exports.getConfig = getConfig;
exports.CHAPA_VERIFY_URL = CHAPA_VERIFY_URL;
