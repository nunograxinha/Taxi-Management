const precoService = require('../services/precoService');

// GET price/
exports.get_preco = async (req, res) => { 
  try {
    const precos = await precoService.getPrecos();
    res.status(200).json(precos);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT price/update/:id
exports.put_preco = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[DEBUG] PUT /price/:id called with id:', id);
    console.log('[DEBUG] Body received:', req.body);

    const updatedpreco = await precoService.updatePreco(id, req.body);

    res.status(200).json(updatedpreco);
  } catch (error) {
    console.error('[ERROR] Error in put_preco handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};