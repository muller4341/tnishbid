const express = require('express');
const chapaController = require('../controllers/chapaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/chapa/initialize', authMiddleware, chapaController.initializeBidPayment);
router.get('/chapa/callback', chapaController.handleCallback);

module.exports = router;
