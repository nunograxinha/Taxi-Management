const clientService = require('../services/clientService');

function canAccessClient(req, id) {
  if (req.user?.role === 'manager') return true;
  if (req.user?.role === 'client') {
    const requesterId = req.user.clientId || req.user.id;
    return Boolean(requesterId && String(requesterId) === String(id));
  }
  return false;
}

// GET /client
exports.getClients = async (req, res) => {
  try {
    const clients = await clientService.getClients();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /client/:id
exports.getClientById = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await clientService.getClientById(id);
    if (!client) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /client
exports.createClient = async (req, res) => {
  try {
    const client = await clientService.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /client/:id
exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const { NIF, name, gender } = req.body;

  try {
    const updatedClient = await clientService.updateClientById(id, { NIF, name, gender });
    if (!updatedClient) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /client/:id
exports.deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedClient = await clientService.deleteClientById(id);
    if (!deletedClient) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json({ message: `Client with ID ${id} deleted successfully`, deletedClient });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /client/:id/favorites
exports.getFavoritePlaces = async (req, res) => {
  const { id } = req.params;
  if (!canAccessClient(req, id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const favoritePlaces = await clientService.getFavoritePlaces(id);
    if (favoritePlaces === null) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json({ favoritePlaces });
  } catch (error) {
    console.error('Error fetching favorite places:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /client/:id/favorites
exports.updateFavoritePlaces = async (req, res) => {
  const { id } = req.params;
  if (!canAccessClient(req, id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const places = req.body?.favoritePlaces;
    const favoritePlaces = await clientService.updateFavoritePlaces(id, places);
    if (favoritePlaces === null) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json({ favoritePlaces });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) {
      console.error('Error updating favorite places:', error);
    }
    res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
};

// PUT /client/:id/photo
exports.updateClientPhoto = async (req, res) => {
  const { id } = req.params;
  if (!canAccessClient(req, id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const updatedClient = await clientService.updateClientPhoto(id, req.body?.profilePhoto);
    if (!updatedClient) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json(updatedClient);
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) {
      console.error('Error updating client photo:', error);
    }
    res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
};
