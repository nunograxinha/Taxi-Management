const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.get_clientes);
router.get('/:id', clienteController.get_cliente_by_id);
router.post('/', clienteController.post_cliente);
router.delete('/:id', clienteController.delete_cliente);

module.exports = router;
