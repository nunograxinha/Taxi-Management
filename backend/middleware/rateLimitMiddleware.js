function getClientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'] || req?.headers?.['X-Forwarded-For'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }
  return req?.ip || req?.socket?.remoteAddress || 'unknown';
}

function setHeaderSafe(res, name, value) {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader(name, value);
  }
}

function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    maxAttempts = 10,
    keyPrefix = 'rl',
    skipSuccessfulRequests = false,
    message = 'Too many requests. Please try again later.',
    nowFn = () => Date.now()
  } = options;

  const buckets = new Map();

  function pruneExpired(now) {
    for (const [key, entry] of buckets.entries()) {
      if (entry.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }

  function middleware(req, res, next) {
    const now = nowFn();
    if (buckets.size > 1000) {
      pruneExpired(now);
    }

    const key = `${keyPrefix}:${getClientIp(req)}`;
    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    if (entry.count >= maxAttempts) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      setHeaderSafe(res, 'Retry-After', String(retryAfterSeconds));
      setHeaderSafe(res, 'X-RateLimit-Limit', String(maxAttempts));
      setHeaderSafe(res, 'X-RateLimit-Remaining', '0');
      setHeaderSafe(res, 'X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
      return res.status(429).json({
        error: message,
        retryAfterSeconds
      });
    }

    entry.count += 1;
    setHeaderSafe(res, 'X-RateLimit-Limit', String(maxAttempts));
    setHeaderSafe(res, 'X-RateLimit-Remaining', String(Math.max(0, maxAttempts - entry.count)));

    if (skipSuccessfulRequests && res && typeof res.on === 'function') {
      res.on('finish', () => {
        if (res.statusCode < 400 && entry.count > 0) {
          entry.count -= 1;
        }
      });
    }

    return next();
  }

  middleware.reset = () => {
    buckets.clear();
  };

  return middleware;
}

module.exports = {
  getClientIp,
  createRateLimiter
};
