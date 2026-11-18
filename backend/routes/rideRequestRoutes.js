const express = require('express');
const router = express.Router();
const rideRequestController = require('../controllers/rideRequestController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, rideRequestController.getRideRequests);
router.get('/share/:shareToken', rideRequestController.getSharedTrip);
router.get('/:id', authenticateToken, rideRequestController.getRideRequest);
router.post('/', requireRole('client', 'manager'), rideRequestController.createRideRequest);
router.post('/:id/share', requireRole('client', 'manager'), rideRequestController.createShareLink);
router.delete('/:id', authenticateToken, rideRequestController.deleteRideRequest);
router.patch('/:id', authenticateToken, rideRequestController.updateRideRequest);

router.patch('/:id/reject', authenticateToken, rideRequestController.rejectRideRequest);
router.patch('/:id/acceptDriver', requireRole('driver', 'manager'), rideRequestController.acceptRideRequestDriver);
router.get('/:id/requestDriver', authenticateToken, rideRequestController.requestDriver);
router.patch('/:id/acceptClient', authenticateToken, rideRequestController.acceptRideRequestClient);
router.get('/:id/clientConfirm', authenticateToken, rideRequestController.clientConfirm);

module.exports = router;
