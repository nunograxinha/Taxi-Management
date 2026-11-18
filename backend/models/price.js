const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  pricePerMinuteConfort: { type: Number, required: true, min: 0.1 },
  pricePerMinuteLuxury: { type: Number, required: true, min: 0.1 },
  nightTimeSurcharge: { type: Number, default: 0.0, min: 0.0 },
}, { timestamps: true });


const Price = mongoose.model('Price', priceSchema);

module.exports = { Price };
