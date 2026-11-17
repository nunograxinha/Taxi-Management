const express = require('express');
const router = express.Router();
const precoController = require('../controllers/priceController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', precoController.get_preco);
router.put('/:id', requireRole('manager'), precoController.put_preco);

module.exports = router;
