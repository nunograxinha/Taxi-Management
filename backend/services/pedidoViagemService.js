const { PedidoViagem } = require('../models/pedidoViagem');
const clienteService = require('./clienteService');

module.exports = {

  getpedidos: async () => {
    try {
        const pedidos = await PedidoViagem.find().populate('cliente');
        return pedidos;
    } catch (error) {
        console.error('Error fetching ride requests:', error);
        throw new Error('Error fetching ride requests');
    }
  },

  deletePedido: async (id) => {
    try {
        const deletedPedido = await PedidoViagem.findByIdAndDelete(id);
        if (!deletedPedido) {
            throw new Error('Ride request not found');
        }
        return deletedPedido;
    } catch (error) {
        console.error('Error deleting ride request:', error);
        throw new Error('Error deleting ride request');
    }
  },

    getPedido: async (id) => {
      try {
          const pedido = await PedidoViagem.findById(id).populate('cliente');
          if (!pedido) {
            throw new Error('Ride request not found');
          }
          return pedido;
      } catch (error) {
          console.error('Error fetching ride request by ID:', error);
          throw new Error('Error fetching ride request by ID');
        }
    },

    postPedido: async (body) => {
      try {
        const cliente = await clienteService.getClienteBy_id(body.cliente);
        if (!cliente) {
          throw new Error('Client not found');
        }
        const pedido = new PedidoViagem(body);
        const savedpedido = await pedido.save();
        return savedpedido;
      } catch (error) {
        console.error('Error creating ride request:', error);
        throw new Error('Error creating ride request');      }
    },
    
};
