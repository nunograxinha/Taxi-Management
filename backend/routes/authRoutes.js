const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/manager', authController.loginManager);
router.post('/driver', authController.loginDriver);
router.post('/driver/change-password', authenticateToken, authController.changeDriverPassword);
router.post('/client', authController.loginClient);
router.post('/client/register', authController.registerClient);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
