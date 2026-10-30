const express = require('express');
const drawController = require('../controllers/drawController');

const router = express.Router();

router.get('/', drawController.getDraws);
router.get('/:id', drawController.getDrawDetails);

module.exports = router;
