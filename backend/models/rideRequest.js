const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  numberOfPeople: { type: Number, required: true, min:1},
  distanceKmToDriver: { type: Number, required: false, min: 0, default: null },
  entryAddress: { type: String, required: true },
  exitAddress: { type: String, required: true },
  entryAddressLabel: { type: String, default: null },
  exitAddressLabel: { type: String, default: null },
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
  shareToken: { type: String, default: null, index: true },
}, { timestamps: true });

const RideRequest = mongoose.model('RideRequest', rideRequestSchema);

module.exports = { RideRequest };