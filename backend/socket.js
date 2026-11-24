const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { RideRequest } = require('./models/rideRequest');

let io = null;
const lastDriverLocations = new Map();
const tripChats = new Map();
const MAX_CHAT_HISTORY = 100;

function buildChatMessage(data) {
  if (!data || !data.pedidoId) return null;
  if (data.senderRole !== 'client' && data.senderRole !== 'driver') return null;

  const cleanText = String(data.text || '').trim().slice(0, 300);
  if (!cleanText) return null;

  const room = String(data.pedidoId);
  const senderName =
    String(data.senderName || '').trim().slice(0, 80) ||
    (data.senderRole === 'driver' ? 'Driver' : 'Client');

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pedidoId: room,
    senderRole: data.senderRole,
    senderName,
    text: cleanText,
    timestamp: new Date().toISOString()
  };
}

async function loadTripChatHistory(room) {
  if (tripChats.has(room)) {
    return tripChats.get(room);
  }
  if (mongoose.Types.ObjectId.isValid(room) && mongoose.connection.readyState === 1) {
    try {
      const reqDoc = await RideRequest.findById(room).select('chatMessages').lean();
      const history = Array.isArray(reqDoc?.chatMessages)
        ? reqDoc.chatMessages.slice(-MAX_CHAT_HISTORY)
        : [];
      tripChats.set(room, history);
      return history;
    } catch {
      return [];
    }
  }
  return [];
}

async function persistChatMessage(room, msg) {
  if (!mongoose.Types.ObjectId.isValid(room) || mongoose.connection.readyState !== 1) {
    return;
  }
  try {
    await RideRequest.findByIdAndUpdate(room, {
      $push: {
        chatMessages: {
          $each: [msg],
          $slice: -MAX_CHAT_HISTORY
        }
      }
    });
  } catch {
    // Keep live in-memory chat responsive even if persistence fails transiently
  }
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinPedido', async (pedidoId) => {
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
        const history = await loadTripChatHistory(room);
        socket.emit('chat:history', {
          pedidoId: room,
          messages: history
        });
      }
    });

    socket.on('chat:getHistory', async (pedidoId) => {
      if (pedidoId) {
        const room = String(pedidoId);
        socket.join(room);
        const history = await loadTripChatHistory(room);
        socket.emit('chat:history', {
          pedidoId: room,
          messages: history
        });
      }
    });

    socket.on('chat:send', (data) => {
      const msg = buildChatMessage(data);
      if (!msg) return;

      const room = msg.pedidoId;
      const history = tripChats.get(room) || [];
      history.push(msg);
      if (history.length > MAX_CHAT_HISTORY) {
        history.splice(0, history.length - MAX_CHAT_HISTORY);
      }
      tripChats.set(room, history);

      socket.join(room);
      io.to(room).emit('chat:message', msg);
      void persistChatMessage(room, msg);
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

module.exports = {
  initSocket,
  getIO,
  getLastDriverLocation,
  getAllDriverLocations,
  clearTripChat,
  buildChatMessage
};
