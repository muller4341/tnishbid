const express = require('express');
const bidController = require('../controllers/bidController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/place', authMiddleware, bidController.placeBid);

module.exports = router;
