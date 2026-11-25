const test = require('node:test');
const assert = require('node:assert/strict');

const { getHealthPayload, createHealthHandler } = require('../utils/healthCheck');

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

test('getHealthPayload returns 200 ok when database is connected and 503 degraded otherwise', () => {
  const healthy = getHealthPayload(1, 42.7);
  assert.equal(healthy.statusCode, 200);
  assert.equal(healthy.body.status, 'ok');
  assert.equal(healthy.body.database, 'connected');
  assert.equal(healthy.body.uptimeSeconds, 43);
  assert.ok(!Number.isNaN(Date.parse(healthy.body.timestamp)));

  const disconnected = getHealthPayload(0, 10);
  assert.equal(disconnected.statusCode, 503);
  assert.equal(disconnected.body.status, 'degraded');
  assert.equal(disconnected.body.database, 'disconnected');

  const connecting = getHealthPayload(2, 5);
  assert.equal(connecting.statusCode, 503);
  assert.equal(connecting.body.status, 'degraded');
  assert.equal(connecting.body.database, 'connecting');
});

test('createHealthHandler writes health status and JSON payload from readyState getter', () => {
  let state = 1;
  const handler = createHealthHandler(() => state);

  const resOk = createMockRes();
  handler({}, resOk);
  assert.equal(resOk.statusCode, 200);
  assert.equal(resOk.body.status, 'ok');
  assert.equal(resOk.body.database, 'connected');

  state = 0;
  const resDown = createMockRes();
  handler({}, resDown);
  assert.equal(resDown.statusCode, 503);
  assert.equal(resDown.body.status, 'degraded');
  assert.equal(resDown.body.database, 'disconnected');
});
