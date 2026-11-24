const tripService = require('../services/tripService');

// GET /trip
exports.getTrips = async (req, res) => {
  try {
    const trips = await tripService.getTrips();
    if (!trips || trips.length === 0) {
      return res.status(404).json({ error: 'No trips found' });
    }
    res.status(200).json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /trip/:id
exports.getTripById = async (req, res) => {
  const { id } = req.params;
  try {
    const trip = await tripService.getTripById(id);
    if (!trip) return res.status(404).json({ error: `Trip with ID ${id} not found` });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /trip
exports.createTrip = async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /trip/:id
exports.updateTrip = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const updatedTrip = await tripService.updateTripById(id, updateData);
    if (!updatedTrip) return res.status(404).json({ error: `Trip with ID ${id} not found` });
    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /trip/:id
exports.deleteTrip = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTrip = await tripService.deleteTripById(id);
    if (!deletedTrip) return res.status(404).json({ error: `Trip with ID ${id} not found` });
    res.status(200).json({ message: `Trip with ID ${id} deleted successfully`, deletedTrip });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /trip/:id/rate
exports.rateTrip = async (req, res) => {
  const { id } = req.params;
  const { rating, ratingComment } = req.body || {};
  try {
    const result = await tripService.rateTrip(id, rating, ratingComment, req.user);
    res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) {
      console.error('Error rating trip:', error);
    }
    res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
};

exports.getTripsByDriver = async (req, res) => {
  const { id } = req.params;
  try {
    const trips = await tripService.getTripsByDriver(id);
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
