const test = require('node:test');
const assert = require('node:assert/strict');

const { signToken } = require('../utils/jwt');
const { RideRequest } = require('../models/rideRequest');
const {
  extractSocketToken,
  authenticateSocketHandshake,
  canSendChatMessage,
  canEmitDriverLocation,
  canRequestFleetLocations
} = require('../socket');

function runHandshake(handshake) {
  return new Promise((resolve) => {
    const socket = { handshake, data: {} };
    authenticateSocketHandshake(socket, (err) => {
      resolve({ err: err || null, socket });
    });
  });
}

test('extractSocketToken reads auth.token and Authorization header', () => {
  assert.equal(extractSocketToken({ auth: { token: 'abc.def' } }), 'abc.def');
  assert.equal(extractSocketToken({ auth: { token: 'Bearer xyz.123' } }), 'xyz.123');
  assert.equal(
    extractSocketToken({ auth: {}, headers: { authorization: 'Bearer hdr.tok' } }),
    'hdr.tok'
  );
  assert.equal(extractSocketToken({ auth: {}, headers: {} }), null);
});

test('authenticateSocketHandshake rejects missing or invalid credentials and accepts valid role JWTs', async () => {
  const missing = await runHandshake({ auth: {}, headers: {} });
  assert.equal(missing.err?.message, 'Authentication required');

  const tampered = await runHandshake({ auth: { token: 'bad.jwt.token' }, headers: {} });
  assert.equal(tampered.err?.message, 'Invalid or expired authentication token');

  const expired = signToken({ role: 'driver', nif: '123456789' }, -10);
  const expiredRes = await runHandshake({ auth: { token: expired }, headers: {} });
  assert.equal(expiredRes.err?.message, 'Invalid or expired authentication token');

  const unknownRole = signToken({ role: 'admin' }, 60);
  const unknownRes = await runHandshake({ auth: { token: unknownRole }, headers: {} });
  assert.equal(unknownRes.err?.message, 'Invalid or expired authentication token');

  for (const role of ['manager', 'driver', 'client']) {
    const token = signToken({ role, userId: 'u1' }, 60);
    const ok = await runHandshake({ auth: { token }, headers: {} });
    assert.equal(ok.err, null);
    assert.equal(ok.socket.data.isPublicShare, false);
    assert.equal(ok.socket.data.user.role, role);
  }
});

test('authenticateSocketHandshake allows active 32-hex shareToken and rejects malformed or inactive shareToken', async () => {
  const originalFindOne = RideRequest.findOne;
  try {
    const badFormat = await runHandshake({ auth: { shareToken: 'short-token' }, headers: {} });
    assert.equal(badFormat.err?.message, 'Invalid or expired share link');

    const validHex = 'a'.repeat(32);
    RideRequest.findOne = () => ({
      select: () => ({
        lean: async () => ({ _id: 'ride-room-42' })
      })
    });

    const activeShare = await runHandshake({ auth: { shareToken: validHex }, headers: {} });
    assert.equal(activeShare.err, null);
    assert.equal(activeShare.socket.data.user, null);
    assert.equal(activeShare.socket.data.isPublicShare, true);
    assert.equal(activeShare.socket.data.sharedRoom, 'ride-room-42');

    RideRequest.findOne = () => ({
      select: () => ({
        lean: async () => null
      })
    });

    const expiredShare = await runHandshake({ auth: { shareToken: validHex }, headers: {} });
    assert.equal(expiredShare.err?.message, 'Invalid or expired share link');
  } finally {
    RideRequest.findOne = originalFindOne;
  }
});

test('socket event role guards restrict sensitive actions by role', () => {
  assert.equal(canSendChatMessage({ role: 'client' }), true);
  assert.equal(canSendChatMessage({ role: 'driver' }), true);
  assert.equal(canSendChatMessage({ role: 'manager' }), false);
  assert.equal(canSendChatMessage(null), false);

  assert.equal(canEmitDriverLocation({ role: 'driver' }), true);
  assert.equal(canEmitDriverLocation({ role: 'client' }), false);
  assert.equal(canEmitDriverLocation({ role: 'manager' }), false);

  assert.equal(canRequestFleetLocations({ role: 'manager' }), true);
  assert.equal(canRequestFleetLocations({ role: 'driver' }), false);
  assert.equal(canRequestFleetLocations({ role: 'client' }), false);
});
