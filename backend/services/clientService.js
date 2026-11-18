const { Client } = require('../models/client');
const { hashPassword } = require('../utils/password');

module.exports = {
  getClients: async () => {
    try {
      const clients = await Client.find();
      return clients;
    } catch (error) {
      throw error;
    }
  },

  createClient: async (body) => {
    try {
      const existingClient = await Client.findOne({
        NIF: body.NIF,
        name: body.name,
        gender: body.gender,
      });

      if (existingClient) {
        return existingClient;
      }

      const data = { ...body };
      if (data.password) {
        data.passwordHash = hashPassword(data.password);
        delete data.password;
      }

      const client = new Client(data);
      const savedClient = await client.save();
      const result = savedClient.toObject();
      delete result.passwordHash;
      return result;
    } catch (error) {
      throw error;
    }
  },

  getClientById: async (id) => {
    try {
      const client = await Client.findOne({ _id: id });
      return client;
    } catch (error) {
      throw error;
    }
  },

  updateClientById: async (id, updateData) => {
    try {
      const updatedClient = await Client.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return updatedClient;
    } catch (error) {
      throw error;
    }
  },

  deleteClientById: async (id) => {
    try {
      const deletedClient = await Client.findOneAndDelete({ _id: id });
      return deletedClient;
    } catch (error) {
      throw error;
    }
  },
};
