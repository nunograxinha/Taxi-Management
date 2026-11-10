const express = require('express');
const router = express.Router();
const faturaController = require('../controllers/faturaController');

router.get('/', faturaController.get_faturas);
router.get('/:id', faturaController.get_fatura_by_id);
router.post('/', faturaController.create_fatura);
router.put('/:id', faturaController.update_fatura);
router.delete('/:id', faturaController.delete_fatura);

module.exports = router;
