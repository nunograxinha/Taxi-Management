const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', priceController.getPrice);
router.put('/:id', requireRole('manager'), priceController.updatePrice);

module.exports = router;
