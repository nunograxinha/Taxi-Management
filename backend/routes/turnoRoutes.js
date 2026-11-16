const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turnoController');

router.get('/', turnoController.get_turnos);
router.get('/interval', turnoController.get_turnos_in_time_frame);
router.get('/intervalo', turnoController.get_turnos_in_time_frame);
router.get('/:id', turnoController.get_turno_by_id);
router.post('/', turnoController.post_turno);
router.put('/:id', turnoController.update_turno);
router.delete('/:id', turnoController.delete_turno);
router.get('/driver/:driverNIF', turnoController.get_turnos_by_motorista);
router.get('/motorista/:driverNIF', turnoController.get_turnos_by_motorista);
router.get('/taxi/:licensePlate', turnoController.get_turnos_by_taxi);

module.exports = router;
