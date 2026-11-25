const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

function parseAllowedOrigins(rawValue) {
  if (typeof rawValue !== 'string') {
    return '*';
  }
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === '*') {
    return '*';
  }

  const origins = trimmed
    .split(',')
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return origins.length > 0 ? origins : '*';
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin || allowedOrigins === '*') {
    return true;
  }
  const normalized = String(origin).trim().replace(/\/+$/, '');
  return Array.isArray(allowedOrigins) && allowedOrigins.includes(normalized);
}

function buildCorsOptions(rawValue = process.env.CORS_ORIGIN) {
  const allowedOrigins = parseAllowedOrigins(rawValue);
  if (allowedOrigins === '*') {
    return {
      origin: '*',
      methods: DEFAULT_METHODS
    };
  }

  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: DEFAULT_METHODS,
    credentials: true
  };
}

module.exports = {
  parseAllowedOrigins,
  isOriginAllowed,
  buildCorsOptions
};
