const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { initSocket, getIO } = require('./socket');
const { RideRequest } = require('./models/rideRequest');

dotenv.config();

const invoiceRoutes = require('./routes/invoiceRoutes');
const driverRoutes = require('./routes/driverRoutes');
const taxiRoutes = require('./routes/taxiRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const tripRoutes = require('./routes/tripRoutes');
const priceRoutes = require('./routes/priceRoutes');
const rideRequestRoutes = require('./routes/rideRequestRoutes');
const clientRoutes = require('./routes/clientRoutes');
const initRoutes = require('./routes/initRoutes');
const authRoutes = require('./routes/authRoutes');

const priceService = require('./services/priceService');
const initController = require('./controllers/initController');

const cors = require('cors');
const { buildCorsOptions } = require('./utils/corsConfig');
const { createHealthHandler } = require('./utils/healthCheck');
const app = express();
const server = http.createServer(app);
initSocket(server);

const mongoDB = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taxi_app';
const PORT = process.env.PORT || 3073;

app.use(bodyParser.json({ limit: '1mb' }));
app.use(cors(buildCorsOptions()));

mongoose.set('strictQuery', false);
main().catch((err) => console.log(err));

const RIDE_REQUEST_EXPIRY_MS = 5 * 60 * 1000;

async function main() {
  await mongoose.connect(mongoDB);
  console.log('Connected to MongoDB');
  await priceService.initPrice();
  await initController.seedInitialData();
  await cancelExpiredRideRequests();
  setInterval(() => {
    cancelExpiredRideRequests().catch((err) =>
      console.error('Error cancelling expired ride requests:', err)
    );
  }, 30 * 1000);
}

async function cancelExpiredRideRequests() {
  const cutoff = new Date(Date.now() - RIDE_REQUEST_EXPIRY_MS);
  const expired = await RideRequest.find({
    driverId: null,
    startTime: null,
    createdAt: { $lt: cutoff }
  }).select('_id');

  if (!expired.length) return;

  const ids = expired.map((p) => p._id);
  await RideRequest.deleteMany({ _id: { $in: ids } });

  const io = getIO();
  if (io) {
    for (const id of ids) {
      const strId = String(id);
      io.to(strId).emit('pedido:deleted', { id: strId, reason: 'expired' });
      io.emit('pedido:deleted', { id: strId, reason: 'expired' });
    }
  }
  console.log(`Auto-cancelled ${ids.length} expired pending ride request(s).`);
}

const handleHealth = createHealthHandler(() => mongoose.connection.readyState);
app.get('/health', handleHealth);

// Root routes
app.use('/', initRoutes);
app.use('/auth', authRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/driver', driverRoutes);
app.use('/taxi', taxiRoutes);
app.use('/shift', shiftRoutes);
app.use('/trip', tripRoutes);
app.use('/price', priceRoutes);
app.use('/rideRequest', rideRequestRoutes);
app.use('/client', clientRoutes);

// Unified /api prefix for reverse-proxy / HTTPS tunnel setups
const apiRouter = express.Router();
apiRouter.get('/health', handleHealth);
apiRouter.use('/', initRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/invoice', invoiceRoutes);
apiRouter.use('/driver', driverRoutes);
apiRouter.use('/taxi', taxiRoutes);
apiRouter.use('/shift', shiftRoutes);
apiRouter.use('/trip', tripRoutes);
apiRouter.use('/price', priceRoutes);
apiRouter.use('/rideRequest', rideRequestRoutes);
apiRouter.use('/client', clientRoutes);
app.use('/api', apiRouter);

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({ error: 'Request payload is too large.' });
  }
  if (err && err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: err.message });
  }
  console.error('Unhandled request error:', err);
  return res.status(err?.statusCode || 500).json({ error: err?.message || 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
