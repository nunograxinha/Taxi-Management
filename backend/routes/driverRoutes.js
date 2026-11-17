const express = require('express');
const router = express.Router();
const motoristaController = require('../controllers/driverController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', motoristaController.get_motoristas);
router.get('/:nif', motoristaController.get_motorista_by_nif);
router.get('/id/:id', motoristaController.get_motorista_by_id);
router.post('', requireRole('manager'), motoristaController.post_motorista);
router.put('/:nif', requireRole('manager'), motoristaController.update_motorista);
router.delete('/:nif', requireRole('manager'), motoristaController.delete_motorista);

module.exports = router;
