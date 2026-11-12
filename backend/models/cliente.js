const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    NIF: { 
        type: String, 
        unique: false, 
        required: true,
        match: [/^\d{9}$/, 'Client NIF must have exactly 9 digits'] 
      },
    name: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
}, { timestamps: true });

clienteSchema.index({ createdAt: -1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = { Cliente };
