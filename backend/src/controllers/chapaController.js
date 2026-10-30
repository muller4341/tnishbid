const prisma = require('../prismaClient');
const bidController = require('./bidController');
const { invalidateItemCache } = require('./itemController');

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

const getConfig = () => {
  const secretKey = (process.env.CHAPA_SECRET_KEY || 'CHAPUBK-cjRlKJzo9HXQPNWcLAxnHYchL5kEuu0J').trim();
  if (!secretKey) {
    throw new Error('CHAPA_SECRET_KEY is not configured on the server');
  }
  if (!process.env.CHAPA_CALLBACK_URL && !process.env.BACKEND_PUBLIC_URL) {
    throw new Error('Set CHAPA_CALLBACK_URL or BACKEND_PUBLIC_URL on the server');
  }
  return {
    secretKey,
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
  const { item_id, amount, phone_number } = req.body;
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
    let rawPhone = String(phone_number || user.phone_number || '').replace(/\D/g, '');
    if (rawPhone.startsWith('251')) rawPhone = '0' + rawPhone.slice(3);
    if (!rawPhone.startsWith('0') && (rawPhone.startsWith('9') || rawPhone.startsWith('7'))) rawPhone = '0' + rawPhone;

    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: bidFee,
        bid_amount: parsedBidAmount,
        status: 'pending',
        payment_method: 'chapa',
        payment_type: 'bid_purchase',
        paid_phone: rawPhone || null,
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
    if (/^(09|07)\d{8}$/.test(rawPhone)) chapaPayload.phone_number = rawPhone;

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

    const txRef = `tinish-inline-${userId}-${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bidFee = item.base_price != null ? item.base_price : 1.00;
    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: bidFee,
        bid_amount: parsedBidAmount,
        status: 'pending',
        payment_method: 'chapa',
        payment_type: 'bid_purchase',
        user_id: userId
      }
    });

    res.json({ tx_ref: txRef, amount: bidFee });
  } catch (error) {
    console.error('Inline Chapa preparation error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.completeInlineBidPayment = async (req, res) => {
  const { tx_ref: txRef, chapa_ref: chapaRef, item_id: bodyItemId } = req.body;
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
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}` }
    });
    const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
    const verifiedAmount = Number(verified.data?.amount);
    if (verifiedStatus !== 'success' || (Number.isFinite(verifiedAmount) && Math.abs(verifiedAmount - payment.amount) > 0.001)) {
      return res.status(400).json({ error: 'Chapa payment could not be verified' });
    }

    const verifiedChapaRef = verified.data?.reference || verified.data?.ref_id || (typeof chapaRef === 'string' ? chapaRef : null);

    const result = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.transaction.findUnique({ where: { tx_ref: txRef } });
      if (!currentPayment) throw new Error('Payment record not found');
      if (currentPayment.status === 'completed') return null;
      const bid = await bidController.createBidRecord(tx, {
        itemId: targetItemId,
        userId: currentPayment.user_id,
        amount: currentPayment.bid_amount,
        transactionId: currentPayment.id,
        io: req.io
      });
      await tx.transaction.update({
        where: { tx_ref: txRef },
        data: { status: 'completed', chapa_ref: verifiedChapaRef }
      });
      return bid;
    });

    if (result && req.io) {
      invalidateItemCache(targetItemId);
      req.io.emit('bid_update', {
        item_id: Number(targetItemId),
        new_bid_amount: result.amount,
        is_unique: result.is_unique,
        total_bids: result.total_bids,
        bid: result
      });
    }
    res.json({ status: 'success', bid: result });
  } catch (error) {
    console.error('Inline Chapa completion error:', error.message);
    res.status(502).json({ error: error.message });
  }
};

exports.prepareInlineWalletDeposit = async (req, res) => {
  const { amount, method } = req.body;
  const userId = req.user.id;

  try {
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: 'Please enter more than 1' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const normalizedMethod = String(method || '').toLowerCase().includes('cbe') ? 'cbe' : 'telebirr';
    const txRef = `tinish-w-inline-${userId}-${normalizedMethod}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: parsedAmount,
        status: 'pending',
        payment_method: normalizedMethod,
        payment_type: 'deposit',
        user_id: userId
      }
    });

    res.json({
      success: true,
      tx_ref: txRef,
      amount: parsedAmount,
      method: normalizedMethod === 'cbe' ? 'cbe' : 'telebirr'
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

    const normalizedMethod = String(method || '').toLowerCase().includes('cbe') ? 'cbe' : 'telebirr';
    const txRef = `tinish-wallet-${userId}-${normalizedMethod}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nameParts = (user.name || 'Tinish Bid User').trim().split(/\s+/);
    let rawPhone = String(phone_number || user.phone_number || '').replace(/\D/g, '');
    if (rawPhone.startsWith('251')) rawPhone = '0' + rawPhone.slice(3);
    if (!rawPhone.startsWith('0') && (rawPhone.startsWith('9') || rawPhone.startsWith('7'))) rawPhone = '0' + rawPhone;

    await prisma.transaction.create({
      data: {
        tx_ref: txRef,
        amount: parsedAmount,
        status: 'pending',
        payment_method: normalizedMethod,
        payment_type: 'deposit',
        paid_phone: rawPhone || null,
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
    if (/^(09|07)\d{8}$/.test(rawPhone)) chapaPayload.phone_number = rawPhone;

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
  const { tx_ref: txRef, method: passedMethod, payment_method: passedPaymentMethod } = req.body;
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
    const rawMethod = String(
      passedMethod ||
      passedPaymentMethod ||
      verified.data?.payment_method ||
      (txRef.toLowerCase().includes('-cbe-') || txRef.toLowerCase().includes('cbe') ? 'cbe' : '') ||
      (txRef.toLowerCase().includes('-telebirr-') || txRef.toLowerCase().includes('tele') ? 'telebirr' : '') ||
      'telebirr'
    ).toLowerCase();

    const methodName = rawMethod.includes('cbe') ? 'CBE Birr' : 'Telebirr';
    const normMethod = rawMethod.includes('cbe') ? 'cbe' : 'telebirr';

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

      await tx.transaction.upsert({
        where: { tx_ref: txRef },
        create: {
          tx_ref: txRef,
          amount: verifiedAmount,
          status: 'completed',
          payment_method: normMethod,
          payment_type: 'deposit',
          user_id: userId,
          chapa_ref: verified.data?.reference || verified.data?.ref_id || null
        },
        update: {
          status: 'completed',
          amount: verifiedAmount,
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
  if (txRef.startsWith('tinish-wallet-') || txRef.startsWith('tinish-w-inline-')) {
    try {
      const config = getConfig();
      const verified = await chapaRequest(`${CHAPA_VERIFY_URL}/${encodeURIComponent(txRef)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${config.secretKey}` }
      });
      const verifiedStatus = String(verified.data?.status || verified.status || '').toLowerCase();
      if (verifiedStatus === 'success') {
        const verifiedAmount = Number(verified.data?.amount);
        const parts = txRef.split('-');
        const userId = parts[2];
        if (userId && Number.isFinite(verifiedAmount)) {
          const existingTx = await prisma.transaction.findUnique({
            where: { tx_ref: txRef }
          });
          if (!existingTx || existingTx.status !== 'completed') {
            await prisma.$transaction(async (tx) => {
              await tx.user.update({
                where: { id: userId },
                data: { wallet_balance: { increment: verifiedAmount } }
              });
              await tx.transaction.upsert({
                where: { tx_ref: txRef },
                create: {
                  tx_ref: txRef,
                  amount: verifiedAmount,
                  status: 'completed',
                  payment_method: txRef.includes('-cbe-') ? 'cbe' : 'telebirr',
                  payment_type: 'deposit',
                  user_id: userId,
                  chapa_ref: verified.data?.reference || verified.data?.ref_id || null
                },
                update: {
                  status: 'completed',
                  amount: verifiedAmount,
                  chapa_ref: verified.data?.reference || verified.data?.ref_id || null
                }
              });
              await tx.notification.create({
                data: {
                  user_id: userId,
                  message: `Deposit Successful! ${verifiedAmount.toFixed(2)} Birr credited to your wallet via Chapa (Txn: ${txRef}).`,
                  notification_type: 'deposit'
                }
              });
            });
          }
        }
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

    const targetItemId = extractItemIdFromTxRef(txRef, req.query.item_id);
    if (!targetItemId) return redirectToResult(res, 'failed', txRef, 'Auction item could not be identified');

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

    const result = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.transaction.findUnique({ where: { tx_ref: txRef } });
      if (!currentPayment) throw new Error('Payment record not found');
      if (currentPayment.status === 'completed') return null;

      const bid = await bidController.createBidRecord(tx, {
        itemId: targetItemId,
        userId: currentPayment.user_id,
        amount: currentPayment.bid_amount,
        transactionId: currentPayment.id,
        io: req.io
      });
      await tx.transaction.update({
        where: { tx_ref: txRef },
        data: { status: 'completed', chapa_ref: verified.data?.ref_id || verified.data?.transaction_id || null }
      });
      return bid;
    });

    if (result) {
      invalidateItemCache(targetItemId);
      if (req.io) {
        req.io.emit('bid_update', {
          item_id: Number(targetItemId),
          new_bid_amount: result.amount,
          is_unique: result.is_unique,
          total_bids: result.total_bids,
          bid: result
        });
      }
    }
    return redirectToResult(res, 'success', txRef);
  } catch (error) {
    console.error('Chapa callback error:', error.message);
    return redirectToResult(res, 'failed', txRef, error.message);
  }
};
