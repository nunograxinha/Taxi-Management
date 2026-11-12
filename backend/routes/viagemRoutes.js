const express = require('express');
const router = express.Router();
const viagemController = require('../controllers/viagemController');

router.get('/driver/:id', viagemController.get_viagens_by_motorista);
router.get('/motorista/:id', viagemController.get_viagens_by_motorista);
router.get('/', viagemController.get_viagems);
router.get('/:id', viagemController.get_viagem_by_id);
router.post('/', viagemController.post_viagem);
router.put('/:id', viagemController.update_viagem);
router.delete('/:id', viagemController.delete_viagem);


module.exports = router;
