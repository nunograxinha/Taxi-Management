const mongoose = require('mongoose');

// Ensure referenced schemas are registered
require('./driver');
require('./shift');
require('./client');

const tripSchema = new mongoose.Schema({
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  numberOfPeople: { type: Number, required: true },
  distanceKm: { type: Number, required: true, min: 0 },
  entryTime: { type: Date, required: true },
  exitTime: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.entryTime;
      },
      message: 'exitTime must be after entryTime'
    }
  },
  entryAddress: { type: String, required: true },
  exitAddress: { type: String, required: true },
  entryAddressLabel: { type: String, default: null },
  exitAddressLabel: { type: String, default: null },
  sequenceNumber: { type: Number, min: 1 },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  price: { type: Number, required: true, min: 0 },
}, { timestamps: true });

tripSchema.index({ shift: 1, sequenceNumber: 1 }, { unique: true });

// Auto-increment sequenceNumber per shift
tripSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Trip = mongoose.model('Trip');
    const lastTrip = await Trip.findOne({ shift: this.shift }).sort({ sequenceNumber: -1 });
    this.sequenceNumber = lastTrip && lastTrip.sequenceNumber ? lastTrip.sequenceNumber + 1 : 1;
  }
  next();
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = { Trip };
