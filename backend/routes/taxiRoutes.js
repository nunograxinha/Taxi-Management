const express = require('express');
const router = express.Router();
const taxiController = require('../controllers/taxiController');

router.get('/', taxiController.get_taxis);
router.get('/id/:id', taxiController.get_taxi_by_id);
router.get('/shift', taxiController.get_taxis_available_turno);
router.get('/turno', taxiController.get_taxis_available_turno);
router.get('/:plate', taxiController.get_taxi_by_plate);
router.post('/', taxiController.post_taxi);
router.put('/:plate', taxiController.update_taxi);
router.delete('/:plate', taxiController.delete_taxi);

module.exports = router;
