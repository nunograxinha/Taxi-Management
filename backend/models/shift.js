const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
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

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = { Shift };
