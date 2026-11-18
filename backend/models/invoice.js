const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  date: { type: Date, required: true },
  clientNIF: {
    type: String,
    required: true,
    match: [/^\d{9}$/, 'Client NIF must have exactly 9 digits']
  },
  clientName: { type: String, required: true },
  clientGender: { type: String, enum: ['Male', 'Female', 'Non-binary'], required: true },
  totalAmount: { type: Number, required: true },
  sequenceNumber: { type: Number, required: true, min: 1 },
}, { timestamps: true });


const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = { Invoice };
