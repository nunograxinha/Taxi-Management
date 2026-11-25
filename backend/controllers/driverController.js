const driverService = require('../services/driverService');

// GET /driver
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await driverService.getDrivers();
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /driver/:nif
exports.getDriverByNif = async (req, res) => {
  const { nif } = req.params;
  try {
    const driver = await driverService.getDriverByNIF(nif);
    if (!driver) {
      return res.status(404).json({ error: `Driver with NIF ${nif} not found` });
    }
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getDriverById = async (req, res) => {
  const { id } = req.params;
  try {
    const driver = await driverService.getDriverById(id);
    if (!driver) {
      return res.status(404).json({ error: `Driver with ID ${id} not found` });
    }
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /driver
exports.createDriver = async (req, res) => {
  try {
    const driver = await driverService.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /driver/:nif
exports.updateDriver = async (req, res) => {
  const { nif } = req.params;
  const body = req.body || {};
  const { name, gender, birthYear, address, drivingLicenseNumber } = body;
  const updatePayload = { name, gender, birthYear, address, drivingLicenseNumber };
  if (Object.prototype.hasOwnProperty.call(body, 'profilePhoto')) {
    updatePayload.profilePhoto = body.profilePhoto;
  }

  try {
    const updatedDriver = await driverService.updateDriverByNIF(nif, updatePayload);
    if (!updatedDriver) {
      return res.status(404).json({ error: `Driver with NIF ${nif} not found` });
    }
    if (typeof updatedDriver === 'string') {
      return res.status(400).json({ error: updatedDriver });
    }
    res.status(200).json(updatedDriver);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /driver/:nif/photo
exports.updateDriverPhoto = async (req, res) => {
  const { nif } = req.params;
  if (req.user?.role !== 'manager' && String(req.user?.nif || '') !== String(nif)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const updatedDriver = await driverService.updateDriverPhoto(nif, req.body?.profilePhoto);
    if (!updatedDriver) {
      return res.status(404).json({ error: `Driver with NIF ${nif} not found` });
    }
    res.status(200).json(updatedDriver);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /driver/:nif
exports.deleteDriver = async (req, res) => {
  const { nif } = req.params;
  try {
    const deletedDriver = await driverService.deleteDriverByNIF(nif);
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
