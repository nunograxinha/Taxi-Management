const mongoose = require('mongoose');

const filialSchema = new mongoose.Schema({
    NIPC: {
        type: String,
        unique: true,
        required: true,
        match: [/^\d{9}$/, 'NIPC tem de ter exatamente 9 digitos']
      },
    name: { type: String, required: true },
    phone: {
        type: String,
        match: [/^\d{9}$/, 'Phone tem de ter exatamente 9 digitos']
      },
    address: {
        street: { type: String },
        doorNumber: { type: String },
        postalCode: { type: String },
        city: { type: String },
    },
}, { timestamps: true });


const Filial = mongoose.model('Filial', filialSchema);

module.exports = { Filial };
