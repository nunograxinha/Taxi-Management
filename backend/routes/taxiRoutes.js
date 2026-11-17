const express = require('express');
const router = express.Router();
const taxiController = require('../controllers/taxiController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', taxiController.get_taxis);
router.get('/id/:id', taxiController.get_taxi_by_id);
router.get('/shift', taxiController.get_taxis_available_turno);
router.get('/shift', taxiController.get_taxis_available_turno);
router.get('/:plate', taxiController.get_taxi_by_plate);
router.post('/', requireRole('manager'), taxiController.post_taxi);
router.put('/:plate', requireRole('manager'), taxiController.update_taxi);
router.delete('/:plate', requireRole('manager'), taxiController.delete_taxi);

module.exports = router;
