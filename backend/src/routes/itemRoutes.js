const express = require('express');
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), itemController.createItem);

module.exports = router;
