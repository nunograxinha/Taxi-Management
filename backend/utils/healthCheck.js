const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

function getHealthPayload(readyState, uptimeSeconds = process.uptime()) {
  const isHealthy = readyState === 1;
  const database = DB_STATES[readyState] || 'unknown';
  return {
    statusCode: isHealthy ? 200 : 503,
    body: {
      status: isHealthy ? 'ok' : 'degraded',
      database,
      uptimeSeconds: Math.round(Number(uptimeSeconds) || 0),
      timestamp: new Date().toISOString()
    }
  };
}

function createHealthHandler(getReadyState) {
  return (_req, res) => {
    const { statusCode, body } = getHealthPayload(getReadyState());
    return res.status(statusCode).json(body);
  };
}

module.exports = {
  DB_STATES,
  getHealthPayload,
  createHealthHandler
};
