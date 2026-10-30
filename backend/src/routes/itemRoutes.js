const express = require('express');
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);
router.post('/', authMiddleware, adminMiddleware, upload.any(), itemController.createItem);
router.put('/:id', authMiddleware, adminMiddleware, upload.any(), itemController.updateItem);
router.delete('/:id', authMiddleware, adminMiddleware, itemController.deleteItem);

module.exports = router;
