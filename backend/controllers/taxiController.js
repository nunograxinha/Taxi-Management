const taxiService = require('../services/taxiService');
const turnoService = require('../services/turnoService');

// GET taxi/
exports.get_taxis = async (req, res) => {
    try {
        const taxis = await taxiService.getTaxis();
        res.status(200).json(taxis);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET taxi/turno 
exports.get_taxis_available_turno = async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) {
        return res.status(400).json({ error: 'start and end are required query parameters' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'start and end must be valid dates' });
    }

    try {
        const turnosHappening = await turnoService.getAllTurnosInTimeframe(startDate, endDate);
        const allTaxis = await taxiService.getTaxis();
        const busyTaxiIds = new Set(turnosHappening.map(t => t.taxi.toString()));
        const availableTaxis = allTaxis.filter(taxi => !busyTaxiIds.has(taxi._id.toString()));
        
        console.log("Available Taxis:",availableTaxis)
        res.status(200).json({ availableTaxis });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

// GET taxi/get/:plate
exports.get_taxi_by_plate = async (req, res) => {
    const { plate } = req.params;
    try {
        const taxi = await taxiService.getTaxiByLicensePlate(plate);
        if (!taxi) return res.status(404).json({ error: `Taxi with license plate ${plate} not found` });
        res.status(200).json(taxi);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET taxi/get/id/:id
exports.get_taxi_by_id = async (req, res) => {
    const { id } = req.params;
    try {
        const taxi = await taxiService.getTaxiByID(id);
        if (!taxi) return res.status(404).json({ error: `Taxi with id ${id} not found` });
        res.status(200).json(taxi);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



// POST taxi/create
exports.post_taxi = async (req, res) => {
    try {
        const taxi = await taxiService.createTaxi(req.body);
        res.status(201).json(taxi);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// PUT taxi/update/:plate
exports.update_taxi = async (req, res) => {
    const { plate } = req.params;
    const updateData = req.body;

    try {
        const updatedTaxi = await taxiService.updateTaxiByLicensePlate(plate, updateData);
        if (!updatedTaxi) return res.status(404).json({ error: `Taxi with license plate ${plate} not found` });
        res.status(200).json(updatedTaxi);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// DELETE taxi/delete/:plate
exports.delete_taxi = async (req, res) => {
  const { plate } = req.params;

  try {
      const deletedTaxi = await taxiService.deleteTaxiByLicensePlate(plate);
      if (typeof deletedTaxi === 'string') {
          // Caso de erro: taxi tem turno associado
          return res.status(400).json({ error: deletedTaxi });
      }
      if (!deletedTaxi) {
          return res.status(404).json({ error: `Taxi with license plate ${plate} not found` });
      }
      res.status(200).json({ message: `Taxi with plate ${plate} deleted successfully`, deletedTaxi });
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
};
  