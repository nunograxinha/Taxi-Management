const { Fatura } = require('../models/invoice')

module.exports = {

    getFaturas: async () => {
      try {
        return await Fatura.find();
      } catch (error) {
        throw error;
      }
    },
  
    getFaturaById: async (id) => {
      try {
        return await Fatura.findById(id);
      } catch (error) {
        throw error;
      }
    },
  
    createFatura: async (data) => {
      try {
        const newFatura = new Fatura(data);
        return await newFatura.save();
      } catch (error) {
        throw error;
      }
    },
  
    updateFatura: async (id, updateData) => {
      try {
        return await Fatura.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
      } catch (error) {
        throw error;
      }
    },
  
    deleteFatura: async (id) => {
      try {
        return await Fatura.findByIdAndDelete(id);
      } catch (error) {
        throw error;
      }
    }
  };
  