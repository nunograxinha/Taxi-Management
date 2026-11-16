const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinPedido', (pedidoId) => {
      if (pedidoId) {
        socket.join(String(pedidoId));
      }
    });

    socket.on('leavePedido', (pedidoId) => {
      if (pedidoId) {
        socket.leave(String(pedidoId));
      }
    });

    socket.on('driverLocation', (data) => {
      if (data && data.pedidoId) {
        io.to(String(data.pedidoId)).emit('driver:location', data);
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
