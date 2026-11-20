const express = require('express');
const chapaController = require('../controllers/chapaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/chapa/initialize', authMiddleware, chapaController.initializeBidPayment);
router.post('/chapa/inline/prepare', authMiddleware, chapaController.prepareInlineBidPayment);
router.post('/chapa/inline/complete', authMiddleware, chapaController.completeInlineBidPayment);
router.post('/chapa/wallet/initialize', authMiddleware, chapaController.initializeWalletDeposit);
router.post('/chapa/wallet/inline/prepare', authMiddleware, chapaController.prepareInlineWalletDeposit);
router.post('/chapa/wallet/verify', authMiddleware, chapaController.verifyWalletDeposit);
router.get('/chapa/callback', chapaController.handleCallback);

// Webhook endpoint: handles server-to-server notifications from Chapa (POST and GET)
router.all('/chapa/webhook', chapaController.handleWebhook);

// Manual sync endpoint to verify and recover pending payments
router.all('/chapa/sync-pending', chapaController.syncPendingManual);
router.all('/chapa/reconcile', chapaController.syncPendingManual);

module.exports = router;
