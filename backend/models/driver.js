const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    NIF: { 
        type: String, 
        unique: true, 
        required: true,
        match: [/^\d{9}$/, 'Driver NIF must have exactly 9 digits'] 
      },
    name: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Non-binary'], required: true },
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
    drivingLicenseNumber: { type: String, required: true, unique: true, match: [/^\d+$/, 'Driving license number must contain digits only'] },
    passwordHash: { type: String, select: false },
}, { timestamps: true });

driverSchema.index({ createdAt: -1 });

const Driver = mongoose.model('Driver', driverSchema);

module.exports = { Driver };
