const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    NIF: { 
        type: String, 
        unique: false, 
        required: true,
        match: [/^\d{9}$/, 'NIF de um Cliente tem de ter exatamente 9 digitos'] 
      },
    name: { type: String, required: true },
    gender: { type: String, enum: ['Masculino', 'Feminino'], required: true,},
}, { timestamps: true });

clienteSchema.index({ createdAt: -1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = { Cliente };
