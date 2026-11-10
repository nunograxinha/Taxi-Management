const { Preco } = require('../models/preco');

module.exports = {

    getPrecos: async () => {
        try {
            console.log('[DEBUG] getPrecos() chamado');
            const preco = await Preco.findOne();
            console.log('[DEBUG] Preço encontrado:', preco);
            return preco;
        } catch (error) {
            console.error('[ERROR] Erro ao buscar preço:', error);
            throw error;
        }
    },

    updatePreco: async (id, body) => {
      try {
        console.log(`[DEBUG] updatePreco() chamado com id=${id}`);
        console.log('[DEBUG] Dados recebidos para atualização:', body);
        const updated = await Preco.findByIdAndUpdate(id, body, { new: true });
        console.log('[DEBUG] Preço atualizado:', updated);
        return updated;
      } catch (error) {
        console.error('[ERROR] Erro ao atualizar preço:', error);
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
        console.error('[ERROR] Erro ao inicializar preço:', error);
        throw error;
      }
    }
};
