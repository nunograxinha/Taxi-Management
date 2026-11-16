const turnoService = require('../services/turnoService');
const mongoose = require('mongoose');

// GET /shift
exports.get_turnos = async (req, res) => {
  try {
    const shifts = await turnoService.getTurnos();
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /shift/:id
exports.get_turno_by_id = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const shift = await turnoService.getTurnoById(id);
    if (!shift) {
      return res.status(404).json({ error: `Shift with ID ${id} not found` });
    }
    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /shift
exports.post_turno = async (req, res) => {
  try {
    const driverNif = req.body.driver || req.body.motorista;
    const { taxi, start, end } = req.body;
    const shift = await turnoService.createTurno(driverNif, taxi?._id || taxi, start, end);
    res.status(201).json(shift);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /shift/:id
exports.update_turno = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const updatedShift = await turnoService.updateTurnoById(id, updateData);
    if (!updatedShift) return res.status(404).json({ error: `Shift with ID ${id} not found` });
    res.status(200).json(updatedShift);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /shift/:id
exports.delete_turno = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedShift = await turnoService.deleteTurnoById(id);
    if (!deletedShift) return res.status(404).json({ error: `Shift with ID ${id} not found` });
    res.status(200).json({ message: `Shift with ID ${id} deleted successfully`, deletedShift });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.get_turnos_in_time_frame = async (req, res) => {
  const driverNIF = req.query.driverNIF || req.query.motoristaNIF;
  const { start, end } = req.query;
  if (!driverNIF || !start || !end) {
    return res.status(400).json({ error: 'driverNIF, start, and end are required.' });
  }

  if (driverNIF === "null" || driverNIF === null) {
    return res.status(400).json({ error: 'driverNIF must be a valid ID.' });
  }

  try {
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({ error: 'start and end must be valid dates.' });
    }

    const shifts = await turnoService.getTurnosInTimeframe(driverNIF, startTime, endTime);
    res.status(200).json(shifts);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Error fetching shifts in timeframe' });
  }
};

exports.get_turnos_by_motorista = async (req, res) => {
  try {
    const driverNIF = req.params.driverNIF || req.params.motoristaNIF;
    console.log("driverNIF", driverNIF);
    const shifts = await turnoService.getTurnosByMotoristaNIF(driverNIF);
    console.log("shifts", shifts);

    res.status(200).json(shifts || []);
  } catch (error) {
    console.error("Error fetching shifts by driver NIF:", error);
    res.status(500).json({ error: 'Error fetching driver shifts.' });
  }
};

exports.get_turnos_by_taxi = async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const turnos = await turnoService.getTurnosByTaxiPlate(licensePlate);
    res.status(200).json(turnos || []);
  } catch (error) {
    console.error("Error fetching shifts by taxi license plate:", error);
    res.status(500).json({ error: 'Error fetching taxi shifts.' });
  }
};