const { Filial } = require('../models/filial')

module.exports = {

  getFiliais: async () => {
      try {
          const filiais = await Filial.find();
          console.log(filiais);
          return filiais;
      } catch (error) {
          throw error;
      }
  },

  createFilial: async (body) => {
    try {
        const filial = new Filial(body);
        const savedFilial = await filial.save();
        return savedFilial;
    } catch (error) {
        throw error;
    }
  },

  deleteFilialByNIPC: async (NIPC) => {
    try {
      const deleted = await Filial.findOneAndDelete({ NIPC });
      return deleted;
    } catch (error) {
      throw error;
    }
  },

  getFilialByNIPC: async (nipc) => {
    try {
      const filial = await Filial.findOne({ NIPC: nipc });
      return filial;
    } catch (error) {
      throw error;
    }
  },

  updateFilialByNIPC: async (nipc, updateData) => {
    try {
      const updatedFilial = await Filial.findOneAndUpdate(
        { NIPC: nipc }, 
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return updatedFilial;
    } catch (error) {
      throw error;
    }
  }

}
  