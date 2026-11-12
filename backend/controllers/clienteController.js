const clienteService = require('../services/clienteService');

// GET cliente/
exports.get_clientes = async (req, res) => { 
  try {
    const clientes = await clienteService.getClientes();
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET cliente/get/:id
exports.get_cliente_by_id = async (req, res) => {
  const { id } = req.params;
  try {
    const cliente = await clienteService.getClienteBy_id(id);
    if (!cliente) {
      return res.status(404).json({ error: `Cliente with ID ${id} not found` });
    }
    res.status(200).json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST cliente/create
exports.post_cliente = async (req, res) => {
  try {
    const cliente = await clienteService.createCliente(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT cliente/update/:id
exports.update_cliente = async (req, res) => {
  const { id } = req.params;
  const { NIF, name, gender } = req.body;
  
  try {
    const updatedCliente = await clienteService.updateClienteBy_id(id, { NIF, name, gender });
    if (!updatedCliente) {
      return res.status(404).json({ error: `Cliente with ID ${id} not found` });
    }
    res.status(200).json(updatedCliente);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE cliente/delete/:id
exports.delete_cliente = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCliente = await clienteService.deleteClienteBy_id(id);
    if (!deletedCliente) {
      return res.status(404).json({ error: `Cliente with ID ${id} not found` });
    }
    res.status(200).json({ message: `Cliente with ID ${id} deleted successfully`, deletedCliente });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
