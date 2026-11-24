const { Server } = require('socket.io');

let io = null;
const lastDriverLocations = new Map();
const tripChats = new Map();
const MAX_CHAT_HISTORY = 100;

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
        socket.emit('chat:history', {
          pedidoId: room,
          messages: tripChats.get(room) || []
        });
      }
    });

    socket.on('chat:getHistory', (pedidoId) => {
      if (pedidoId) {
        const room = String(pedidoId);
        socket.join(room);
        socket.emit('chat:history', {
          pedidoId: room,
          messages: tripChats.get(room) || []
        });
      }
    });

    socket.on('chat:send', (data) => {
      if (!data || !data.pedidoId) return;
      if (data.senderRole !== 'client' && data.senderRole !== 'driver') return;

      const cleanText = String(data.text || '').trim().slice(0, 300);
      if (!cleanText) return;

      const room = String(data.pedidoId);
      const senderName =
        String(data.senderName || '').trim().slice(0, 80) ||
        (data.senderRole === 'driver' ? 'Driver' : 'Client');

      const msg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pedidoId: room,
        senderRole: data.senderRole,
        senderName,
        text: cleanText,
        timestamp: new Date().toISOString()
      };

      const history = tripChats.get(room) || [];
      history.push(msg);
      if (history.length > MAX_CHAT_HISTORY) {
        history.splice(0, history.length - MAX_CHAT_HISTORY);
      }
      tripChats.set(room, history);

      socket.join(room);
      io.to(room).emit('chat:message', msg);
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

    socket.on('fleet:getLocations', () => {
      socket.emit('fleet:locations', getAllDriverLocations());
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

function getAllDriverLocations() {
  const list = [];
  for (const [pedidoId, loc] of lastDriverLocations.entries()) {
    list.push({
      pedidoId,
      ...loc
    });
  }
  return list;
}

function clearTripChat(pedidoId) {
  if (pedidoId) {
    const room = String(pedidoId);
    tripChats.delete(room);
    lastDriverLocations.delete(room);
  }
}

module.exports = { initSocket, getIO, getLastDriverLocation, getAllDriverLocations, clearTripChat };
