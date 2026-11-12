const mongoose = require('mongoose');

const motoristaSchema = new mongoose.Schema({
    NIF: { 
        type: String, 
        unique: true, 
        required: true,
        match: [/^\d{9}$/, 'Driver NIF must have exactly 9 digits'] 
      },
    name: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    birthYear: { type: Number, required: true, validate: {
      validator: function(value) {
        return value <= new Date().getFullYear() - 18;
      },
      message: 'Driver must be at least 18 years old'
    }},
    address: {
        street: { type: String },
        doorNumber: { type: String },
        postalCode: { type: String },
        city: { type: String },
    },
    drivingLicenseNumber: { type: String, required: true, unique: true },
}, { timestamps: true });

motoristaSchema.index({ createdAt: -1 });

const Motorista = mongoose.model('Motorista', motoristaSchema);

module.exports = { Motorista };
