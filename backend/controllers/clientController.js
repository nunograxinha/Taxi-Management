const clientService = require('../services/clientService');

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
