const { Invoice } = require('../models/invoice');

module.exports = {
  getInvoices: async () => {
    try {
      return await Invoice.find();
    } catch (error) {
      throw error;
    }
  },

  getInvoiceById: async (id) => {
    try {
      return await Invoice.findById(id);
    } catch (error) {
      throw error;
    }
  },

  createInvoice: async (data) => {
    try {
      const newInvoice = new Invoice(data);
      return await newInvoice.save();
    } catch (error) {
      throw error;
    }
  },

  updateInvoice: async (id, updateData) => {
    try {
      return await Invoice.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    } catch (error) {
      throw error;
    }
  },

  deleteInvoice: async (id) => {
    try {
      return await Invoice.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
};
