const express = require('express');
const router = express.Router();
const pedidoViagemController = require('../controllers/pedidoViagemController');

router.get('/', pedidoViagemController.get_pedidosViagens);
router.get('/:id', pedidoViagemController.get_pedidoViagem);
router.post('/', pedidoViagemController.post_pedidoViagem);
router.delete('/:id', pedidoViagemController.delete_pedidoViagem);
router.patch('/:id', pedidoViagemController.update_pedidoViagem);

router.patch('/:id/reject', pedidoViagemController.reject_pedidoViagem);

router.patch('/:id/acceptDriver', pedidoViagemController.accept_pedidoViagem);
router.patch('/:id/acceptMotorista', pedidoViagemController.accept_pedidoViagem);
router.get('/:id/requestDriver', pedidoViagemController.request_motorista);
router.get('/:id/requestMotorista', pedidoViagemController.request_motorista);

router.patch('/:id/acceptClient', pedidoViagemController.accept_pedidoViagemCliente);
router.get('/:id/clientConfirm', pedidoViagemController.clientConfirm);


module.exports = router;
