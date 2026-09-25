const express = require('express');
const bidController = require('../controllers/bidController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/place', authMiddleware, bidController.placeBid);
router.get('/my-bids', authMiddleware, bidController.getUserBids);

module.exports = router;
