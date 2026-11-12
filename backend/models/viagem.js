const mongoose = require('mongoose');

// Ensure referenced schemas are registered
require('./motorista');
require('./turno');
require('./cliente');

const viagemSchema = new mongoose.Schema({
  turno: { type: mongoose.Schema.Types.ObjectId, ref: 'Turno', required: true },
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
  sequenceNumber: { type: Number, min: 1 },
  motorista: { type: mongoose.Schema.Types.ObjectId, ref: 'Motorista', required: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  preco: { type: Number, required: true, min: 0 },
}, { timestamps: true });

viagemSchema.index({ turno: 1, sequenceNumber: 1 }, { unique: true });

// Auto-increment sequenceNumber per turno
viagemSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Viagem = mongoose.model('Viagem');
    const lastViagem = await Viagem.findOne({ turno: this.turno }).sort({ sequenceNumber: -1 });
    this.sequenceNumber = lastViagem && lastViagem.sequenceNumber ? lastViagem.sequenceNumber + 1 : 1;
  }
  next();
});

const Viagem = mongoose.model('Viagem', viagemSchema);

module.exports = { Viagem };
