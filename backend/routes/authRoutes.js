const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 10,
  keyPrefix: 'auth-login',
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please try again in a few minutes.'
});

const registerRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 20,
  keyPrefix: 'auth-register',
  skipSuccessfulRequests: false,
  message: 'Too many registration requests. Please try again later.'
});

router.post('/manager', loginRateLimiter, authController.loginManager);
router.post('/driver', loginRateLimiter, authController.loginDriver);
router.post('/driver/change-password', loginRateLimiter, authenticateToken, authController.changeDriverPassword);
router.post('/client', loginRateLimiter, authController.loginClient);
router.post('/client/register', registerRateLimiter, authController.registerClient);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
