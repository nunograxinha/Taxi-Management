const priceService = require('../services/priceService');

// GET price/
exports.getPrice = async (req, res) => {
  try {
    const prices = await priceService.getPrices();
    res.status(200).json(prices);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT price/:id
exports.updatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPrice = await priceService.updatePrice(id, req.body);
    res.status(200).json(updatedPrice);
  } catch (error) {
    console.error('[ERROR] Error in updatePrice handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
