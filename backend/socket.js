const { Server } = require('socket.io');

let io = null;
const lastDriverLocations = new Map();

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
        const room = String(pedidoId);
        socket.join(room);
        const lastLocation = lastDriverLocations.get(room);
        if (lastLocation) {
          socket.emit('driver:location', {
            pedidoId: room,
            ...lastLocation
          });
        }
      }
    });

    socket.on('leavePedido', (pedidoId) => {
      if (pedidoId) {
        socket.leave(String(pedidoId));
      }
    });

    socket.on('driverLocation', (data) => {
      if (data && data.pedidoId && Number.isFinite(Number(data.lat)) && Number.isFinite(Number(data.lon))) {
        const room = String(data.pedidoId);
        lastDriverLocations.set(room, {
          lat: Number(data.lat),
          lon: Number(data.lon),
          heading: data.heading || 0,
          updatedAt: Date.now()
        });
        io.to(room).emit('driver:location', data);
        io.emit('driver:location', data);
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

function getLastDriverLocation(pedidoId) {
  return lastDriverLocations.get(String(pedidoId)) || null;
}

module.exports = { initSocket, getIO, getLastDriverLocation };
