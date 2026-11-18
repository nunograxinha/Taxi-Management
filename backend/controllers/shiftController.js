const shiftService = require('../services/shiftService');
const mongoose = require('mongoose');

// GET /shift
exports.getShifts = async (req, res) => {
  try {
    const shifts = await shiftService.getShifts();
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /shift/:id
exports.getShiftById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const shift = await shiftService.getShiftById(id);
    if (!shift) {
      return res.status(404).json({ error: `Shift with ID ${id} not found` });
    }
    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /shift
exports.createShift = async (req, res) => {
  try {
    const driverNif = req.body.driver;
    const { taxi, start, end } = req.body;
    const shift = await shiftService.createShift(driverNif, taxi?._id || taxi, start, end);
    res.status(201).json(shift);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /shift/:id
exports.updateShift = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const updatedShift = await shiftService.updateShiftById(id, updateData);
    if (!updatedShift) return res.status(404).json({ error: `Shift with ID ${id} not found` });
    res.status(200).json(updatedShift);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /shift/:id
exports.deleteShift = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedShift = await shiftService.deleteShiftById(id);
    if (!deletedShift) return res.status(404).json({ error: `Shift with ID ${id} not found` });
    res.status(200).json({ message: `Shift with ID ${id} deleted successfully`, deletedShift });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getShiftsInTimeFrame = async (req, res) => {
  const driverNIF = req.query.driverNIF;
  const { start, end } = req.query;
  if (!driverNIF || !start || !end) {
    return res.status(400).json({ error: 'driverNIF, start, and end are required.' });
  }

  if (driverNIF === 'null' || driverNIF === null) {
    return res.status(400).json({ error: 'driverNIF must be a valid ID.' });
  }

  try {
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({ error: 'start and end must be valid dates.' });
    }

    const shifts = await shiftService.getShiftsInTimeframe(driverNIF, startTime, endTime);
    res.status(200).json(shifts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching shifts in timeframe' });
  }
};

exports.getShiftsByDriver = async (req, res) => {
  try {
    const driverNIF = req.params.driverNIF;
    const shifts = await shiftService.getShiftsByDriverNIF(driverNIF);
    res.status(200).json(shifts || []);
  } catch (error) {
    console.error('Error fetching shifts by driver NIF:', error);
    res.status(500).json({ error: 'Error fetching driver shifts.' });
  }
};

exports.getShiftsByTaxi = async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const shifts = await shiftService.getShiftsByTaxiPlate(licensePlate);
    res.status(200).json(shifts || []);
  } catch (error) {
    console.error('Error fetching shifts by taxi license plate:', error);
    res.status(500).json({ error: 'Error fetching taxi shifts.' });
  }
};
