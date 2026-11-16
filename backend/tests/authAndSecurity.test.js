const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword, safeCompareStrings } = require('../utils/password');
const { signToken, verifyToken } = require('../utils/jwt');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('password hashing and verification works securely', () => {
  const hash = hashPassword('MySecretPass123!');
  assert.match(hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
  assert.equal(verifyPassword('MySecretPass123!', hash), true);
  assert.equal(verifyPassword('WrongPass', hash), false);
  assert.equal(verifyPassword('MySecretPass123!', 'invalid-hash'), false);
});

test('safeCompareStrings compares equal and unequal strings', () => {
  assert.equal(safeCompareStrings('admin123', 'admin123'), true);
  assert.equal(safeCompareStrings('admin123', 'admin124'), false);
  assert.equal(safeCompareStrings('short', 'muchlonger'), false);
});

test('JWT signToken and verifyToken validate payload and reject tampering', () => {
  const token = signToken({ role: 'manager', userId: '42' }, 60);
  const decoded = verifyToken(token);
  assert.equal(decoded.role, 'manager');
  assert.equal(decoded.userId, '42');

  const tampered = `${token.slice(0, -2)}xx`;
  assert.equal(verifyToken(tampered), null);

  const expired = signToken({ role: 'driver' }, -10);
  assert.equal(verifyToken(expired), null);
});

test('requireRole enforces authentication and role permissions', () => {
  const managerMiddleware = requireRole('manager');

  // Missing token -> 401
  const resNoAuth = createMockRes();
  let nextCalled = false;
  managerMiddleware({ headers: {} }, resNoAuth, () => { nextCalled = true; });
  assert.equal(resNoAuth.statusCode, 401);
  assert.equal(nextCalled, false);

  // Driver token on manager-only route -> 403
  const driverToken = signToken({ role: 'driver', nif: '123456789' }, 60);
  const resWrongRole = createMockRes();
  managerMiddleware(
    { headers: { authorization: `Bearer ${driverToken}` } },
    resWrongRole,
    () => { nextCalled = true; }
  );
  assert.equal(resWrongRole.statusCode, 403);
  assert.equal(nextCalled, false);

  // Manager token -> passes
  const managerToken = signToken({ role: 'manager' }, 60);
  const reqValid = { headers: { authorization: `Bearer ${managerToken}` } };
  const resValid = createMockRes();
  managerMiddleware(reqValid, resValid, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(reqValid.user.role, 'manager');
});

test('authenticateToken rejects invalid bearer tokens', () => {
  const res = createMockRes();
  let nextCalled = false;
  authenticateToken({ headers: { authorization: 'Bearer invalid.jwt.token' } }, res, () => {
    nextCalled = true;
  });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});
