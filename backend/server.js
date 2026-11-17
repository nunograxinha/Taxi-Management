const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { initSocket } = require('./socket');

dotenv.config();

const faturaRoutes = require('./routes/invoiceRoutes');
const motoristaRoutes = require('./routes/driverRoutes');
const taxiRoutes = require('./routes/taxiRoutes');
const turnoRoutes = require('./routes/shiftRoutes');
const viagemRoutes = require('./routes/tripRoutes');
const precoRoutes = require('./routes/priceRoutes');
const pedidoViagensRoutes = require('./routes/rideRequestRoutes');
const clienteRoutes = require('./routes/clientRoutes');
const initRoutes = require('./routes/initRoutes');
const authRoutes = require('./routes/authRoutes');


const precoService = require('./services/priceService');
const initController = require('./controllers/initController');

let cors = require('cors');
let app = express();
const server = http.createServer(app);
initSocket(server);

const mongoDB = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taxi_app';
const PORT = process.env.PORT || 3073;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.set("strictQuery", false);
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
  console.log('Connected to MongoDB');
  await precoService.initPreco();
  await initController.seedInitialData();
}

// Use routes (English & legacy aliases)
app.use('/', initRoutes);
app.use('/auth', authRoutes);
app.use('/invoice', faturaRoutes);
app.use('/invoice', faturaRoutes);
app.use('/driver', motoristaRoutes);
app.use('/driver', motoristaRoutes);
app.use('/taxi', taxiRoutes);
app.use('/shift', turnoRoutes);
app.use('/shift', turnoRoutes);
app.use('/trip', viagemRoutes);
app.use('/trip', viagemRoutes);
app.use('/price', precoRoutes);
app.use('/price', precoRoutes);
app.use('/rideRequest', pedidoViagensRoutes);
app.use('/rideRequest', pedidoViagensRoutes);
app.use('/client', clienteRoutes);
app.use('/client', clienteRoutes);

// Unified /api prefix for reverse-proxy / HTTPS tunnel setups
const apiRouter = express.Router();
apiRouter.use('/', initRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/invoice', faturaRoutes);
apiRouter.use('/driver', motoristaRoutes);
apiRouter.use('/taxi', taxiRoutes);
apiRouter.use('/shift', turnoRoutes);
apiRouter.use('/trip', viagemRoutes);
apiRouter.use('/price', precoRoutes);
apiRouter.use('/rideRequest', pedidoViagensRoutes);
apiRouter.use('/client', clienteRoutes);
app.use('/api', apiRouter);

// Start the server (HTTP + Socket.IO)
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});