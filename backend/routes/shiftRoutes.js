const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', requireRole('driver', 'manager'), shiftController.getShifts);
router.get('/interval', requireRole('driver', 'manager'), shiftController.getShiftsInTimeFrame);
router.get('/:id', requireRole('driver', 'manager'), shiftController.getShiftById);
router.post('/', requireRole('driver', 'manager'), shiftController.createShift);
router.put('/:id', requireRole('driver', 'manager'), shiftController.updateShift);
router.delete('/:id', requireRole('driver', 'manager'), shiftController.deleteShift);
router.get('/driver/:driverNIF', requireRole('driver', 'manager'), shiftController.getShiftsByDriver);
router.get('/taxi/:licensePlate', requireRole('driver', 'manager'), shiftController.getShiftsByTaxi);

module.exports = router;
