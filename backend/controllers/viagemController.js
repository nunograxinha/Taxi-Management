const viagemService = require('../services/viagemService');

// GET trip/
exports.get_viagems = async (req, res) => {
  try {
    const viagens = await viagemService.getViagems();
    if (!viagens || viagens.length === 0) {
      return res.status(404).json({ error: 'No trips found' });
    }
    res.status(200).json(viagens);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// GET trip/get/:id
exports.get_viagem_by_id = async (req, res) => {
  const { id } = req.params;
  try {
    const viagem = await viagemService.getViagemById(id);
    if (!viagem) return res.status(404).json({ error: `Trip with ID ${id} not found` });
    res.status(200).json(viagem);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST trip/create
exports.post_viagem = async (req, res) => {
  try {
    const viagem = await viagemService.createViagem(req.body);
    res.status(201).json(viagem);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT trip/update/:id
exports.update_viagem = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const updatedViagem = await viagemService.updateViagemById(id, updateData);
    if (!updatedViagem) return res.status(404).json({ error: `Trip with ID ${id} not found` });
    res.status(200).json(updatedViagem);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE trip/delete/:id
exports.delete_viagem = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedViagem = await viagemService.deleteViagemById(id);
    if (!deletedViagem) return res.status(404).json({ error: `Trip with ID ${id} not found` });
    res.status(200).json({ message: `Trip with ID ${id} deleted successfully`, deletedViagem });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.get_viagens_by_motorista = async (req, res) => {
  const { id } = req.params;
  try {
    const viagens = await viagemService.getViagensByMotorista(id);
    res.status(200).json(viagens);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
