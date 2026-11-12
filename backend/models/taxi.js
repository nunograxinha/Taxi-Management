const mongoose = require('mongoose');

const taxiSchema = new mongoose.Schema({
    licensePlate: { type: String, unique: true, required: true, match: [/^([A-Za-z0-9]{2}-){2}[A-Za-z0-9]{2}$/, 'Invalid format. Use XX-00-XX, 00-XX-00, etc.']},
    purchaseYear: { 
        type: Number, 
        required: true, 
        validate: {
            validator: value => value <= new Date().getFullYear(),
            message: 'Purchase year cannot be in the future'
        }
    },
    confort: {
        type: String,
        required: true,
        enum: {
            values: ['Basic', 'Luxury'],
            message: 'Comfort level must be "Basic" or "Luxury"'
        }
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
}, { timestamps: true });

taxiSchema.index({ createdAt: -1 });

const Taxi = mongoose.model('Taxi', taxiSchema);

module.exports = { Taxi };
