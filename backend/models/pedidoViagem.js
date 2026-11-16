const mongoose = require('mongoose');

const pedidoViagemSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  numberOfPeople: { type: Number, required: true, min:1},
  distanceKmToDriver: { type: Number, required: false, min: 0, default: null },
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
  driverId: { type: String, default: null },
  taxi: { type: String, default: null },
  clientAccepted: { type: Boolean, default: false },
  rejectedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  price: { type: Number, default: null },
}, { timestamps: true });

const PedidoViagem = mongoose.model('RideRequest', pedidoViagemSchema);

module.exports = { PedidoViagem, RideRequest: PedidoViagem };