const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    NIF: { 
        type: String, 
        unique: false, 
        required: true,
        match: [/^\d{9}$/, 'Client NIF must have exactly 9 digits'] 
      },
    name: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Non-binary'], required: true },
    profilePhoto: { type: String, default: null },
    passwordHash: { type: String, select: false },
    favoritePlaces: [
      {
        label: { type: String, required: true, trim: true, maxlength: 40 },
        icon: { type: String, enum: ['home', 'work', 'star', 'place'], default: 'star' },
        address: { type: String, required: true, trim: true, maxlength: 200 },
        coords: { type: String, required: true, trim: true }
      }
    ]
}, { timestamps: true });

clientSchema.index({ createdAt: -1 });

const Client = mongoose.model('Client', clientSchema);

module.exports = { Client };
