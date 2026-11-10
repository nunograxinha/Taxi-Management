const motoristaService = require('../services/motoristaService');

// GET motorista/
exports.get_motoristas = async (req, res) => { 
  try {
    const motoristas = await motoristaService.getMotoristas();
    res.status(200).json(motoristas);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET motorista/get/:nif
exports.get_motorista_by_nif = async (req, res) => {
  const { nif } = req.params;
  try {
    const motorista = await motoristaService.getMotoristaByNIF(nif);
    if (!motorista) {
      return res.status(404).json({ error: `Motorista with NIF ${nif} not found` });
    }
    res.status(200).json(motorista);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.get_motorista_by_id = async (req, res) => {
  const { id } = req.params;
  try {
    const motorista = await motoristaService.getMotoristaById(id);
    if (!motorista) {
      return res.status(404).json({ error: `Motorista with NIF ${id} not found` });
    }
    res.status(200).json(motorista);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST motorista/create
exports.post_motorista = async (req, res) => {
  try {
    const motorista = await motoristaService.createMotorista(req.body);
    res.status(201).json(motorista);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT motorista/update/:nif
exports.update_motorista = async (req, res) => {
  const { nif } = req.params;
  const { name, gender, birthYear, address, drivingLicenseNumber} = req.body;
  
  try {
    const updatedMotorista = await motoristaService.updateMotoristaByNIF(nif, { name, gender, birthYear, address, drivingLicenseNumber});
    if (!updatedMotorista) {
      return res.status(404).json({ error: `Motorista with NIF ${nif} not found` });
    }
    if (typeof updatedMotorista === 'string') {
      return res.status(400).json({ error: updatedMotorista });
    }
    res.status(200).json(updatedMotorista);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE motorista/delete/:nif
exports.delete_motorista = async (req, res) => {
  const { nif } = req.params;
  try {
    const deletedMotorista = await motoristaService.deleteMotoristaByNIF(nif);
    if (typeof deletedMotorista === 'string') {
      // Caso de erro: motorista tem turno associado
      return res.status(400).json({ error: deletedMotorista });
    }
    if (!deletedMotorista) {
      return res.status(404).json({ error: `Motorista with NIF ${nif} not found` });
    }
    res.status(200).json({ message: `Motorista with NIF ${nif} deleted successfully`, deletedMotorista });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
