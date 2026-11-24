const mongoose = require('mongoose');
const { Client } = require('../models/client');
const { hashPassword } = require('../utils/password');

const VALID_FAVORITE_ICONS = new Set(['home', 'work', 'star', 'place']);

function sanitizeCoords(raw) {
  if (typeof raw !== 'string') return null;
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null;
  }
  return `${lat},${lon}`;
}

function sanitizeFavoritePlaces(places) {
  if (!Array.isArray(places)) {
    const err = new Error('favoritePlaces must be an array.');
    err.statusCode = 400;
    throw err;
  }

  const sanitized = [];
  for (const entry of places.slice(0, 10)) {
    const label = typeof entry?.label === 'string' ? entry.label.trim().slice(0, 40) : '';
    const address = typeof entry?.address === 'string' ? entry.address.trim().slice(0, 200) : '';
    const coords = sanitizeCoords(entry?.coords);
    const icon = VALID_FAVORITE_ICONS.has(entry?.icon) ? entry.icon : 'star';

    if (!label || !address || !coords) {
      const err = new Error('Each favorite place requires a label, address, and valid coordinates.');
      err.statusCode = 400;
      throw err;
    }

    sanitized.push({ label, icon, address, coords });
  }

  return sanitized;
}

module.exports = {
  sanitizeCoords,
  sanitizeFavoritePlaces,

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

  getFavoritePlaces: async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const client = await Client.findById(id).select('favoritePlaces');
    if (!client) return null;
    return client.favoritePlaces || [];
  },

  updateFavoritePlaces: async (id, places) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const sanitized = sanitizeFavoritePlaces(places);

    const updated = await Client.findByIdAndUpdate(
      id,
      { $set: { favoritePlaces: sanitized } },
      { new: true, runValidators: true }
    ).select('favoritePlaces');

    return updated ? updated.favoritePlaces || [] : null;
  },
};
