const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');

const { parseAllowedOrigins, isOriginAllowed, buildCorsOptions } = require('../utils/corsConfig');
const { getClientIp, createRateLimiter } = require('../middleware/rateLimitMiddleware');

function createMockRes() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.body = null;
  res.setHeader = (name, value) => {
    res.headers[name] = value;
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

test('parseAllowedOrigins and isOriginAllowed support wildcard and comma-separated origin lists', () => {
  assert.equal(parseAllowedOrigins(undefined), '*');
  assert.equal(parseAllowedOrigins(' * '), '*');

  const list = parseAllowedOrigins('https://taxi.example.com/, http://localhost:4200 ,');
  assert.deepEqual(list, ['https://taxi.example.com', 'http://localhost:4200']);
  assert.equal(isOriginAllowed('http://localhost:4200/', list), true);
  assert.equal(isOriginAllowed('https://taxi.example.com', list), true);
  assert.equal(isOriginAllowed(undefined, list), true);
  assert.equal(isOriginAllowed('https://evil.example.com', list), false);
});

test('buildCorsOptions enforces configured origins and permits wildcard by default', () => {
  const wildcardOpts = buildCorsOptions('*');
  assert.equal(wildcardOpts.origin, '*');

  const restrictedOpts = buildCorsOptions('http://localhost:4200');
  assert.equal(restrictedOpts.credentials, true);

  restrictedOpts.origin('http://localhost:4200', (err, allowed) => {
    assert.equal(err, null);
    assert.equal(allowed, true);
  });

  restrictedOpts.origin('https://blocked.example.com', (err, allowed) => {
    assert.equal(err?.message, 'Origin not allowed by CORS');
    assert.equal(allowed, undefined);
  });
});

test('createRateLimiter blocks after maxAttempts, skips 2xx when configured, and isolates IPs', () => {
  let fakeNow = 1_000_000;
  const limiter = createRateLimiter({
    windowMs: 60_000,
    maxAttempts: 2,
    keyPrefix: 'login',
    skipSuccessfulRequests: true,
    message: 'Too many attempts',
    nowFn: () => fakeNow
  });

  assert.equal(getClientIp({ headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' } }), '203.0.113.5');

  // Successful login (200) should NOT consume attempt budget
  const resOk = createMockRes();
  let nextOk = false;
  limiter({ headers: { 'x-forwarded-for': '203.0.113.5' } }, resOk, () => {
    nextOk = true;
    resOk.statusCode = 200;
    resOk.emit('finish');
  });
  assert.equal(nextOk, true);

  // Two failed attempts (401) exhaust budget
  for (let i = 0; i < 2; i++) {
    const resFail = createMockRes();
    let passed = false;
    limiter({ headers: { 'x-forwarded-for': '203.0.113.5' } }, resFail, () => {
      passed = true;
      resFail.statusCode = 401;
      resFail.emit('finish');
    });
    assert.equal(passed, true);
  }

  // Third failed attempt is blocked with 429
  const resBlocked = createMockRes();
  let blockedPassed = false;
  limiter({ headers: { 'x-forwarded-for': '203.0.113.5' } }, resBlocked, () => {
    blockedPassed = true;
  });
  assert.equal(blockedPassed, false);
  assert.equal(resBlocked.statusCode, 429);
  assert.equal(resBlocked.body.error, 'Too many attempts');
  assert.equal(resBlocked.body.retryAfterSeconds, 60);
  assert.equal(resBlocked.headers['Retry-After'], '60');
  assert.equal(resBlocked.headers['X-RateLimit-Remaining'], '0');

  // Different IP is unaffected
  const resOtherIp = createMockRes();
  let otherIpPassed = false;
  limiter({ headers: { 'x-forwarded-for': '198.51.100.9' } }, resOtherIp, () => {
    otherIpPassed = true;
  });
  assert.equal(otherIpPassed, true);

  // Advancing past windowMs resets the bucket
  fakeNow += 61_000;
  const resReset = createMockRes();
  let resetPassed = false;
  limiter({ headers: { 'x-forwarded-for': '203.0.113.5' } }, resReset, () => {
    resetPassed = true;
  });
  assert.equal(resetPassed, true);
});
