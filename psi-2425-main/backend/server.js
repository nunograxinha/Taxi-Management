const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

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


const precoService = require('./services/precoService');

let cors = require('cors');
let app = express();

const mongoDB = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3073;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.set("strictQuery", false);
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
  console.log('Connected to MongoDB Atlas');
  await precoService.initPreco();
}

// Use routes
app.use('/', initRoutes);
app.use('/fatura', faturaRoutes);
app.use('/motorista', motoristaRoutes);
app.use('/taxi', taxiRoutes);
app.use('/turno', turnoRoutes);
app.use('/viagem', viagemRoutes);
app.use('/preco', precoRoutes);
app.use('/pedidoViagem', pedidoViagensRoutes);
app.use('/cliente', clienteRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});