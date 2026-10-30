const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password/send-otp', authController.sendResetOtp);
router.post('/forgot-password/verify-otp', authController.verifyResetOtp);
router.post('/forgot-password/reset', authController.resetPassword);

module.exports = router;
