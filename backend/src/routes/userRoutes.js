const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.post('/add-funds', authMiddleware, userController.addFunds);
router.get('/notifications', authMiddleware, userController.getNotifications);
router.put('/notifications/:id/read', authMiddleware, userController.markNotificationRead);

module.exports = router;
