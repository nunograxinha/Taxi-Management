const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { initSocket } = require('./socket');

dotenv.config();

const faturaRoutes = require('./routes/faturaRoutes');
const motoristaRoutes = require('./routes/motoristaRoutes');
const taxiRoutes = require('./routes/taxiRoutes');
const turnoRoutes = require('./routes/turnoRoutes');
const viagemRoutes = require('./routes/viagemRoutes');
const precoRoutes = require('./routes/precoRoutes');
const pedidoViagensRoutes = require('./routes/pedidoViagemRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const initRoutes = require('./routes/initRoutes');
const authRoutes = require('./routes/authRoutes');


const precoService = require('./services/precoService');
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
app.use('/fatura', faturaRoutes);
app.use('/driver', motoristaRoutes);
app.use('/motorista', motoristaRoutes);
app.use('/taxi', taxiRoutes);
app.use('/shift', turnoRoutes);
app.use('/turno', turnoRoutes);
app.use('/trip', viagemRoutes);
app.use('/viagem', viagemRoutes);
app.use('/price', precoRoutes);
app.use('/preco', precoRoutes);
app.use('/rideRequest', pedidoViagensRoutes);
app.use('/pedidoViagem', pedidoViagensRoutes);
app.use('/client', clienteRoutes);
app.use('/cliente', clienteRoutes);

// Start the server (HTTP + Socket.IO)
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});