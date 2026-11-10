const express = require('express');
const router = express.Router();
const motoristaController = require('../controllers/motoristaController');

router.get('/', motoristaController.get_motoristas);
router.get('/:nif', motoristaController.get_motorista_by_nif);
router.get('/id/:id', motoristaController.get_motorista_by_id);
router.post('', motoristaController.post_motorista);
router.put('/:nif', motoristaController.update_motorista);
router.delete('/:nif', motoristaController.delete_motorista);

module.exports = router;
