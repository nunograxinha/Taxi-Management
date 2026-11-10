const mongoose = require('mongoose');

const faturaSchema = new mongoose.Schema({
  Viagem: { type: mongoose.Schema.Types.ObjectId, ref: 'Viagem', required: true },
  date: { type: Date, required: true },
  clientNIF: {
    type: String,
    required: true,
    match: [/^\d{9}$/, 'NIF de um Cliente tem de ter exatamente 9 digitos']
  },
  clientName: { type: String, required: true },
  clientGender: { type: String, enum: ['Masculino', 'Feminino'], required: true },
  totalAmount: { type: Number, required: true },
  sequenceNumber: { type: Number, required: true, min: 1 },
}, { timestamps: true });


const Fatura = mongoose.model('Fatura', faturaSchema);

module.exports = { Fatura };
