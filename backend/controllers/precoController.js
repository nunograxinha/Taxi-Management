const precoService = require('../services/precoService');

// GET preco/
exports.get_preco = async (req, res) => { 
  try {
    const precos = await precoService.getPrecos();
    res.status(200).json(precos);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT preco/update/:nif
exports.put_preco = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[DEBUG] PUT /preco/:id chamado com id:', id);
    console.log('[DEBUG] Body recebido:', req.body);

    const updatedpreco = await precoService.updatePreco(id, req.body);

    res.status(200).json(updatedpreco);
  } catch (error) {
    console.error('[ERROR] Erro no put_preco handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};