const motoristaService = require('../services/driverService');

// GET /driver
exports.get_motoristas = async (req, res) => { 
  try {
    const drivers = await motoristaService.getMotoristas();
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /driver/:nif
exports.get_motorista_by_nif = async (req, res) => {
  const { nif } = req.params;
  try {
    const driver = await motoristaService.getMotoristaByNIF(nif);
    if (!driver) {
      return res.status(404).json({ error: `Driver with NIF ${nif} not found` });
    }
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.get_motorista_by_id = async (req, res) => {
  const { id } = req.params;
  try {
    const driver = await motoristaService.getMotoristaById(id);
    if (!driver) {
      return res.status(404).json({ error: `Driver with ID ${id} not found` });
    }
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /driver
exports.post_motorista = async (req, res) => {
  try {
    const driver = await motoristaService.createMotorista(req.body);
    res.status(201).json(driver);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /driver/:nif
exports.update_motorista = async (req, res) => {
  const { nif } = req.params;
  const { name, gender, birthYear, address, drivingLicenseNumber} = req.body;
  
  try {
    const updatedDriver = await motoristaService.updateMotoristaByNIF(nif, { name, gender, birthYear, address, drivingLicenseNumber});
    if (!updatedDriver) {
      return res.status(404).json({ error: `Driver with NIF ${nif} not found` });
    }
    if (typeof updatedDriver === 'string') {
      return res.status(400).json({ error: updatedDriver });
    }
    res.status(200).json(updatedDriver);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /driver/:nif
exports.delete_motorista = async (req, res) => {
  const { nif } = req.params;
  try {
    const deletedDriver = await motoristaService.deleteMotoristaByNIF(nif);
    if (typeof deletedDriver === 'string') {
      // Error case: driver has an associated shift
      return res.status(400).json({ error: deletedDriver });
    }
    if (!deletedDriver) {
      return res.status(404).json({ error: `Driver with NIF ${nif} not found` });
    }
    res.status(200).json({ message: `Driver with NIF ${nif} deleted successfully`, deletedDriver });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
