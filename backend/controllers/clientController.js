const clienteService = require('../services/clientService');

// GET /client
exports.get_clientes = async (req, res) => { 
  try {
    const clients = await clienteService.getClientes();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /client/:id
exports.get_cliente_by_id = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await clienteService.getClienteBy_id(id);
    if (!client) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /client
exports.post_cliente = async (req, res) => {
  try {
    const client = await clienteService.createCliente(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /client/:id
exports.update_cliente = async (req, res) => {
  const { id } = req.params;
  const { NIF, name, gender } = req.body;
  
  try {
    const updatedClient = await clienteService.updateClienteBy_id(id, { NIF, name, gender });
    if (!updatedClient) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /client/:id
exports.delete_cliente = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedClient = await clienteService.deleteClienteBy_id(id);
    if (!deletedClient) {
      return res.status(404).json({ error: `Client with ID ${id} not found` });
    }
    res.status(200).json({ message: `Client with ID ${id} deleted successfully`, deletedClient });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
