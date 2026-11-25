const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { RideRequest } = require('./models/rideRequest');
const { verifyToken } = require('./utils/jwt');
const { buildCorsOptions } = require('./utils/corsConfig');

let io = null;
const lastDriverLocations = new Map();
const tripChats = new Map();
const MAX_CHAT_HISTORY = 100;
const VALID_ROLES = new Set(['manager', 'driver', 'client']);

function canSendChatMessage(user) {
  return Boolean(user && (user.role === 'client' || user.role === 'driver'));
}

function canEmitDriverLocation(user) {
  return Boolean(user && user.role === 'driver');
}

function canRequestFleetLocations(user) {
  return Boolean(user && user.role === 'manager');
}

function extractSocketToken(handshake) {
  const rawAuthToken = handshake?.auth?.token;
  if (typeof rawAuthToken === 'string' && rawAuthToken.trim()) {
    const trimmed = rawAuthToken.trim();
    return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
  }

  const rawHeader = handshake?.headers?.authorization || handshake?.headers?.Authorization;
  if (typeof rawHeader === 'string' && rawHeader.startsWith('Bearer ')) {
    return rawHeader.slice(7).trim() || null;
  }

  return null;
}

async function authenticateSocketHandshake(socket, next) {
  const token = extractSocketToken(socket?.handshake);
  if (token) {
    const payload = verifyToken(token);
    if (!payload || !VALID_ROLES.has(payload.role)) {
      return next(new Error('Invalid or expired authentication token'));
    }
    socket.data = {
      ...(socket.data || {}),
      user: payload,
      isPublicShare: false,
      sharedRoom: null
    };
    return next();
  }

  const rawShareToken = socket?.handshake?.auth?.shareToken;
  const shareToken = typeof rawShareToken === 'string' ? rawShareToken.trim() : '';
  if (shareToken) {
    if (!/^[a-f0-9]{32}$/i.test(shareToken)) {
      return next(new Error('Invalid or expired share link'));
    }
    try {
      const rideRequest = await RideRequest.findOne({ shareToken, endTime: null }).select('_id').lean();
      if (rideRequest && rideRequest._id) {
        socket.data = {
          ...(socket.data || {}),
          user: null,
          isPublicShare: true,
          sharedRoom: String(rideRequest._id)
        };
        return next();
      }
      return next(new Error('Invalid or expired share link'));
    } catch {
      return next(new Error('Could not verify share link'));
    }
  }

  return next(new Error('Authentication required'));
}

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
    cors: buildCorsOptions()
  });

  io.use(authenticateSocketHandshake);

  io.on('connection', (socket) => {
    if (socket.data?.isPublicShare && socket.data?.sharedRoom) {
      const room = String(socket.data.sharedRoom);
      socket.join(room);
      const lastLocation = lastDriverLocations.get(room);
      if (lastLocation) {
        socket.emit('driver:location', {
          pedidoId: room,
          ...lastLocation
        });
      }
      socket.on('leavePedido', (pedidoId) => {
        if (String(pedidoId) === room) {
          socket.leave(room);
        }
      });
      return;
    }

    const user = socket.data?.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.join(`role:${user.role}`);

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
      if (!canSendChatMessage(user)) return;

      const msg = buildChatMessage({
        ...data,
        senderRole: user.role,
        senderName: data?.senderName || user.name
      });
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
      if (!canEmitDriverLocation(user)) return;
      if (data && data.pedidoId && Number.isFinite(Number(data.lat)) && Number.isFinite(Number(data.lon))) {
        const room = String(data.pedidoId);
        lastDriverLocations.set(room, {
          lat: Number(data.lat),
          lon: Number(data.lon),
          heading: data.heading || 0,
          updatedAt: Date.now()
        });
        io.to(room).emit('driver:location', data);
        io.to('role:manager').emit('driver:location', data);
      }
    });

    socket.on('fleet:getLocations', () => {
      if (!canRequestFleetLocations(user)) return;
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
  buildChatMessage,
  extractSocketToken,
  authenticateSocketHandshake,
  canSendChatMessage,
  canEmitDriverLocation,
  canRequestFleetLocations
};
