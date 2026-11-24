const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', requireRole('manager'), clientController.getClients);
router.get('/:id/favorites', requireRole('client', 'manager'), clientController.getFavoritePlaces);
router.put('/:id/favorites', requireRole('client', 'manager'), clientController.updateFavoritePlaces);
router.get('/:id', authenticateToken, clientController.getClientById);
router.post('/', requireRole('manager'), clientController.createClient);
router.delete('/:id', requireRole('manager'), clientController.deleteClient);

module.exports = router;
