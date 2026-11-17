const faturaService = require('../services/invoiceService');

// GET fatura/
exports.get_faturas = async (req, res) => {
  try {
    const faturas = await faturaService.getFaturas();
    res.status(200).json(faturas);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET fatura/get/:id
exports.get_fatura_by_id = async (req, res) => {
  try {
    const fatura = await faturaService.getFaturaById(req.params.id);
    if (!fatura) {
      return res.status(404).json({ error: 'Fatura not found' });
    }
    res.status(200).json(fatura);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST fatura/create
exports.create_fatura = async (req, res) => {
  try {
    const fatura = await faturaService.createFatura(req.body);
    res.status(201).json(fatura);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT fatura/update/:id
exports.update_fatura = async (req, res) => {
  try {
    const updated = await faturaService.updateFatura(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Fatura not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DEL fatura/delete/:id
exports.delete_fatura = async (req, res) => {
  try {
    const deleted = await faturaService.deleteFatura(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Fatura not found' });
    }
    res.status(200).json({ message: 'Fatura deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};