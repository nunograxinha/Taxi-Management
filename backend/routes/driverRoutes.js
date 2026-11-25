const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', driverController.getDrivers);
router.get('/:nif', driverController.getDriverByNif);
router.get('/id/:id', driverController.getDriverById);
router.post('', requireRole('manager'), driverController.createDriver);
router.put('/:nif/photo', requireRole('driver', 'manager'), driverController.updateDriverPhoto);
router.put('/:nif', requireRole('manager'), driverController.updateDriver);
router.delete('/:nif', requireRole('manager'), driverController.deleteDriver);

module.exports = router;
