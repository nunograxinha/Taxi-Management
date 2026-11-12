const mongoose = require('mongoose');

const pedidoViagemSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  numberOfPeople: { type: Number, required: true, min:1},
  distanceKmToMotorista: { type: Number, required: false, min: 0, default: null },
  entryAddress: { type: String, required: true },
  exitAddress: { type: String, required: true },
  confort: {
    type: String,
    required: true,
    enum: {
        values: ['Basic', 'Luxury'],
        message: 'Comfort level must be "Basic" or "Luxury"'
    }
  },
  motoristaId: { type: String, default: null },
  taxi: { type: String, default: null },
  clienteAceitou: { type: Boolean, default: false },
  rejeitados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Motorista' }],
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  price: { type: Number, default: null },
}, { timestamps: true });

const PedidoViagem = mongoose.model('PedidoViagem', pedidoViagemSchema);

module.exports = { PedidoViagem };