const mongoose = require('mongoose');

const taxiSchema = new mongoose.Schema({
    licensePlate: { type: String, unique: true, required: true,match: [/^([A-Za-z0-9]{2}-){2}[A-Za-z0-9]{2}$/, 'Formato inválido. Use o formato XX-00-XX, 00-XX-00, etc.']},
    purchaseYear: { 
        type: Number, 
        required: true, 
        validate: {
            validator: value => value <= new Date().getFullYear(),
            message: 'Ano de compra não pode ser no futuro'
        }
    },
    confort: {
        type: String,
        required: true,
        enum: {
            values: ['Basico', 'Luxuoso'],
            message: 'Conforto deve ser "basico" ou "luxuoso"'
        }
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
}, { timestamps: true });

taxiSchema.index({ createdAt: -1 });

const Taxi = mongoose.model('Taxi', taxiSchema);

module.exports = { Taxi };
