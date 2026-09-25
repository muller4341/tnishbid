const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.get('/stats', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.post('/end-auction/:id', authMiddleware, adminMiddleware, adminController.endAuction);
router.post('/update-wallet/:userId', authMiddleware, adminMiddleware, adminController.updateUserWallet);

module.exports = router;
