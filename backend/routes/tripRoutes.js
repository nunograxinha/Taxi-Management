const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/driver/:id', requireRole('driver', 'manager'), tripController.getTripsByDriver);
router.get('/', authenticateToken, tripController.getTrips);
router.get('/:id', authenticateToken, tripController.getTripById);
router.post('/', requireRole('driver', 'manager'), tripController.createTrip);
router.patch('/:id/rate', requireRole('client', 'manager'), tripController.rateTrip);
router.put('/:id', requireRole('driver', 'manager'), tripController.updateTrip);
router.delete('/:id', requireRole('manager'), tripController.deleteTrip);

module.exports = router;
