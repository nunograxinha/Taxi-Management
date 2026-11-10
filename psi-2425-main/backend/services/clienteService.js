const { Cliente } = require('../models/cliente')

module.exports = {

    getClientes: async () => {
    try {
      const clientes = await Cliente.find();
      return clientes;
    } catch (error) {
      throw error;
    }
  },
  
  createCliente: async (body) => {
    try {
      const existingCliente = await Cliente.findOne({
        NIF: body.NIF,
        name: body.name,
        gender: body.gender,
      });
  
      if (existingCliente) {
        return existingCliente;
      }
  
      const cliente = new Cliente(body);
      const savedCliente = await cliente.save();
      return savedCliente;
    } catch (error) {
      throw error;
    }
  },
  
  
  getClienteBy_id: async (id) => {
    try {
      const clientes = await Cliente.findOne({ _id: id });
      return clientes;
    } catch (error) {
      throw error;
    }
  },
  
  updateClienteBy_id: async (id, updateData) => {
    try {
      const updatedCliente = await Cliente.findOneAndUpdate(
        { _id: id }, 
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return updatedCliente;
    } catch (error) {
      throw error;
    }
  },
  
  deleteClienteBy_id: async (id) => {
    try {
      const deletedCliente = await Cliente.findOneAndDelete({ _id: id });
      return deletedCliente;
    } catch (error) {
      throw error;
    }
  },
}