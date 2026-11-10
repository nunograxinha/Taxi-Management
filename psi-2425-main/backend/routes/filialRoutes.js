const express = require('express');
const router = express.Router();
const filialController = require('../controllers/filialController');

router.get('/', filialController.get_filiais);
router.get('/:nipc', filialController.get_filial_by_nipc);
router.post('/', filialController.post_filial);
router.put('/:nipc', filialController.update_filial);
router.delete('/:nipc', filialController.delete_filial);

router.get('/init', filialController.init_filiais); // Temporario - TODO: endpoint que inicializa base de dados toda (no server.js)

module.exports = router;
