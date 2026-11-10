const turnoService = require('../services/turnoService');
const mongoose = require('mongoose');

// GET turno/
exports.get_turnos = async (req, res) => {
  try {
    const turnos = await turnoService.getTurnos();
    res.status(200).json(turnos);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET turno/get/:id
exports.get_turno_by_id = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const turno = await turnoService.getTurnoById(id);
    if (!turno) {
      return res.status(404).json({ error: `Turno with ID ${id} not found` });
    }
    res.status(200).json(turno);
  } catch (error) {
    console.log("TURNOCONTROLLER")
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST turno/create
exports.post_turno = async (req, res) => {
  console.log("TurnoController, Rq.body:", req.body)
  try {
    const { motorista, taxi, start, end } = req.body;
    const turno = await turnoService.createTurno(motorista, taxi._id, start, end);
    res.status(201).json(turno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT turno/update/:id
exports.update_turno = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const updatedTurno = await turnoService.updateTurnoById(id, updateData);
    if (!updatedTurno) return res.status(404).json({ error: `Turno with ID ${id} not found` });
    res.status(200).json(updatedTurno);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE turno/delete/:id
exports.delete_turno = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTurno = await turnoService.deleteTurnoById(id);
    if (!deletedTurno) return res.status(404).json({ error: `Turno with ID ${id} not found` });
    res.status(200).json({ message: `Turno with ID ${id} deleted successfully`, deletedTurno });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.   get_turnos_in_time_frame = async (req, res) => {
  const { motoristaNIF, start, end } = req.query;
  if (!motoristaNIF || !start || !end) {
    return res.status(400).json({ error: 'motoristaNIF, start e end são obrigatórios.' });
  }

  if (motoristaNIF === "null" || motoristaNIF === null) {
    return res.status(400).json({ error: 'motoristaNIF deve ser um ID válido.' });
  }

  try {
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({ error: 'start e end devem ser datas válidas.' });
    }

    const turnos = await turnoService.getTurnosInTimeframe(motoristaNIF, startTime, endTime);
    res.status(200).json(turnos);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar turnos no intervalo' });
  }
};

exports.get_turnos_by_motorista = async (req, res) => {
  try {
    const { motoristaNIF } = req.params;
    console.log("motoristaNIF", motoristaNIF);
    const turnos = await turnoService.getTurnosByMotoristaNIF(motoristaNIF);
    console.log("turnos", turnos);
    if (turnos.length === 0) {
      return res.status(200).json({ message: 'Nenhum turno encontrado para este motorista.' });
    }

    res.status(200).json(turnos);
  } catch (error) {
    console.error("Erro ao obter turnos por motorista ID:", error);
    res.status(500).json({ error: 'Erro ao obter turnos do motorista.' });
  }
};

exports.get_turnos_by_taxi = async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const turnos = await turnoService.getTurnosByTaxiPlate(licensePlate);
    if (!turnos || turnos.length === 0) {
      return res.status(200).json({ message: 'Nenhum turno encontrado para este táxi.' });
    }
    res.status(200).json(turnos);
  } catch (error) {
    console.error("Erro ao obter turnos por matrícula do táxi:", error);
    res.status(500).json({ error: 'Erro ao obter turnos do táxi.' });
  }
};