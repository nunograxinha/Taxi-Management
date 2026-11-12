const { Preco } = require('../models/preco');

module.exports = {

    getPrecos: async () => {
        try {
            console.log('[DEBUG] getPrecos() called');
            const preco = await Preco.findOne();
            console.log('[DEBUG] Price found:', preco);
            return preco;
        } catch (error) {
            console.error('[ERROR] Error fetching price:', error);
            throw error;
        }
    },

    updatePreco: async (id, body) => {
      try {
        console.log(`[DEBUG] updatePreco() called with id=${id}`);
        console.log('[DEBUG] Data received for update:', body);
        const updated = await Preco.findByIdAndUpdate(id, body, { new: true });
        console.log('[DEBUG] Price updated:', updated);
        return updated;
      } catch (error) {
        console.error('[ERROR] Error updating price:', error);
        throw error;
      }
    },
    
    initPreco: async () => {
      try {
        const existing = await Preco.findOne({});
        if (existing) {
          return existing; 
        }

        const newPreco = new Preco({
          pricePerMinuteConfort: 0.3,
          pricePerMinuteLuxury: 0.7,
          nightTimeSurcharge: 20
        });

        const saved = await newPreco.save();
        return saved;
      } catch (error) {
        console.error('[ERROR] Error initializing price:', error);
        throw error;
      }
    }
};
