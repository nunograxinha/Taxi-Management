const invoiceService = require('../services/invoiceService');

// GET /invoice
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getInvoices();
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /invoice/:id
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /invoice
exports.createInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /invoice/:id
exports.updateInvoice = async (req, res) => {
  try {
    const updated = await invoiceService.updateInvoice(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /invoice/:id
exports.deleteInvoice = async (req, res) => {
  try {
    const deleted = await invoiceService.deleteInvoice(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(200).json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
