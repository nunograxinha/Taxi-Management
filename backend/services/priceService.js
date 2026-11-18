const { Price } = require('../models/price');

module.exports = {
  getPrices: async () => {
    try {
      console.log('[DEBUG] getPrices() called');
      const price = await Price.findOne();
      console.log('[DEBUG] Price found:', price);
      return price;
    } catch (error) {
      console.error('[ERROR] Error fetching price:', error);
      throw error;
    }
  },

  updatePrice: async (id, body) => {
    try {
      console.log(`[DEBUG] updatePrice() called with id=${id}`);
      console.log('[DEBUG] Data received for update:', body);
      const updated = await Price.findByIdAndUpdate(id, body, { new: true });
      console.log('[DEBUG] Price updated:', updated);
      return updated;
    } catch (error) {
      console.error('[ERROR] Error updating price:', error);
      throw error;
    }
  },

  initPrice: async () => {
    try {
      const existing = await Price.findOne({});
      if (existing) {
        return existing;
      }

      const newPrice = new Price({
        pricePerMinuteConfort: 0.3,
        pricePerMinuteLuxury: 0.7,
        nightTimeSurcharge: 20
      });

      const saved = await newPrice.save();
      return saved;
    } catch (error) {
      console.error('[ERROR] Error initializing price:', error);
      throw error;
    }
  }
};
