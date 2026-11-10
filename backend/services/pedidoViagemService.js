const { PedidoViagem } = require('../models/pedidoViagem');
const clienteService = require('./clienteService');

module.exports = {

  getpedidos: async () => {
    try {
        const pedidos = await PedidoViagem.find().populate('cliente');
        return pedidos;
    } catch (error) {
        console.error('Erro ao buscar pedidos de viagem:', error);
        throw new Error('Erro ao buscar pedidos de viagem');
    }
  },

  deletePedido: async (id) => {
    try {
        const deletedPedido = await PedidoViagem.findByIdAndDelete(id);
        if (!deletedPedido) {
            throw new Error('Pedido de viagem não encontrado');
        }
        return deletedPedido;
    } catch (error) {
        console.error('Erro ao excluir pedido de viagem:', error);
        throw new Error('Erro ao excluir pedido de viagem');
    }
  },

    getPedido: async (id) => {
      try {
          const pedido = await PedidoViagem.findById(id).populate('cliente');
          if (!pedido) {
            throw new Error('Pedido de viagem não encontrado');
          }
          return pedido;
      } catch (error) {
          console.error('Erro ao buscar pedido de viagem por ID:', error);
          throw new Error('Erro ao buscar pedido de viagem por ID');
        }
    },

    postPedido: async (body) => {
      try {
        const cliente = await clienteService.getClienteBy_id(body.cliente);
        if (!cliente) {
          throw new Error('Cliente não encontrado');
        }
        const pedido = new PedidoViagem(body);
        const savedpedido = await pedido.save();
        return savedpedido;
      } catch (error) {
        console.error('Erro ao criar pedido de viagem:', error);
        throw new Error('Erro ao criar pedido de viagem');      }
    },
    
};
