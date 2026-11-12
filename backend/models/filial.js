const mongoose = require('mongoose');

const filialSchema = new mongoose.Schema({
    NIPC: {
        type: String,
        unique: true,
        required: true,
        match: [/^\d{9}$/, 'NIPC must have exactly 9 digits']
      },
    name: { type: String, required: true },
    phone: {
        type: String,
        match: [/^\d{9}$/, 'Phone must have exactly 9 digits']
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
