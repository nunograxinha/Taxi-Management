const { PedidoViagem } = require('../models/rideRequest');
const clienteService = require('./clientService');

module.exports = {

  getpedidos: async () => {
    try {
        const requests = await PedidoViagem.find().populate('client');
        return requests;
    } catch (error) {
        console.error('Error fetching ride requests:', error);
        throw new Error('Error fetching ride requests');
    }
  },

  deletePedido: async (id) => {
    try {
        const deletedRequest = await PedidoViagem.findByIdAndDelete(id);
        if (!deletedRequest) {
            throw new Error('Ride request not found');
        }
        return deletedRequest;
    } catch (error) {
        console.error('Error deleting ride request:', error);
        throw new Error('Error deleting ride request');
    }
  },

    getPedido: async (id) => {
      try {
          const request = await PedidoViagem.findById(id).populate('client');
          if (!request) {
            throw new Error('Ride request not found');
          }
          return request;
      } catch (error) {
          console.error('Error fetching ride request by ID:', error);
          throw new Error('Error fetching ride request by ID');
        }
    },

    postPedido: async (body) => {
      try {
        const payload = {
          ...body,
          client: body.client || body.cliente
        };
        const client = await clienteService.getClienteBy_id(payload.client);
        if (!client) {
          throw new Error('Client not found');
        }
        const request = new PedidoViagem(payload);
        const savedRequest = await request.save();
        return savedRequest;
      } catch (error) {
        console.error('Error creating ride request:', error);
        throw new Error('Error creating ride request');
      }
    },
    
};
