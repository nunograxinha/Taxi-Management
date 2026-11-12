const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
  motorista: { type: mongoose.Schema.Types.ObjectId, ref: 'Motorista', required: true },
  taxi: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxi', required: true },
  start: { type: Date, required: true },
  end: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.start;
      },
      message: 'end must be after start'
    }
  },
}, { timestamps: true });

const Turno = mongoose.model('Turno', turnoSchema);

module.exports = { Turno };
