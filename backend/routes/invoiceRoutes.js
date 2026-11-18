const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', requireRole('manager'), invoiceController.getInvoices);
router.get('/:id', authenticateToken, invoiceController.getInvoiceById);
router.post('/', requireRole('driver', 'manager'), invoiceController.createInvoice);
router.put('/:id', requireRole('driver', 'manager'), invoiceController.updateInvoice);
router.delete('/:id', requireRole('manager'), invoiceController.deleteInvoice);

module.exports = router;
