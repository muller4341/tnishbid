const express = require('express');
const chapaController = require('../controllers/chapaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/chapa/initialize', authMiddleware, chapaController.initializeBidPayment);
router.post('/chapa/inline/prepare', authMiddleware, chapaController.prepareInlineBidPayment);
router.post('/chapa/inline/complete', authMiddleware, chapaController.completeInlineBidPayment);
router.get('/chapa/callback', chapaController.handleCallback);

module.exports = router;
