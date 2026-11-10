const express = require('express');
const router = express.Router();
const precoController = require('../controllers/precoController');

router.get('/', precoController.get_preco);
router.put('/:id', precoController.put_preco);

module.exports = router;
