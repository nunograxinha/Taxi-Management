const { Driver } = require('../models/driver');
const { hashPassword } = require('../utils/password');
const { sanitizeProfilePhoto } = require('../utils/photoValidation');

module.exports = {
  getDrivers: async () => {
    try {
      const drivers = await Driver.find();
      return drivers;
    } catch (error) {
      throw error;
    }
  },

  createDriver: async (body) => {
    try {
      const data = { ...body };
      const plainPassword = typeof data.password === 'string' ? data.password.trim() : '';
      if (plainPassword.length < 6) {
        const err = new Error('Initial password must be at least 6 characters long.');
        err.statusCode = 400;
        throw err;
      }
      delete data.password;
      data.passwordHash = hashPassword(plainPassword);

      const sanitizedPhoto = sanitizeProfilePhoto(data.profilePhoto);
      if (sanitizedPhoto !== undefined) {
        data.profilePhoto = sanitizedPhoto;
      } else {
        delete data.profilePhoto;
      }

      const driver = new Driver(data);
      const savedDriver = await driver.save();
      const result = savedDriver.toObject();
      delete result.passwordHash;
      return result;
    } catch (error) {
      throw error;
    }
  },

  getDriverByNIF: async (nif) => {
    try {
      const driver = await Driver.findOne({ NIF: nif });
      return driver;
    } catch (error) {
      throw error;
    }
  },

  getDriverById: async (id) => {
    try {
      const driver = await Driver.findOne({ _id: id });
      return driver;
    } catch (error) {
      throw error;
    }
  },

  updateDriverByNIF: async (nif, updateData) => {
    try {
      const payload = { ...updateData };
      if (Object.prototype.hasOwnProperty.call(payload, 'profilePhoto')) {
        const sanitizedPhoto = sanitizeProfilePhoto(payload.profilePhoto);
        if (sanitizedPhoto === undefined) {
          delete payload.profilePhoto;
        } else {
          payload.profilePhoto = sanitizedPhoto;
        }
      }
      const updatedDriver = await Driver.findOneAndUpdate(
        { NIF: nif },
        { $set: payload },
        { new: true, runValidators: true }
      );
      return updatedDriver;
    } catch (error) {
      throw error;
    }
  },

  updateDriverPhoto: async (nif, rawPhoto) => {
    const profilePhoto = sanitizeProfilePhoto(rawPhoto ?? null);
    return await Driver.findOneAndUpdate(
      { NIF: nif },
      { $set: { profilePhoto } },
      { new: true }
    );
  },

  deleteDriverByNIF: async (nif) => {
    try {
      const shiftService = require('./shiftService');
      const shifts = await shiftService.getShiftsByDriverNIF(nif);
      if (Array.isArray(shifts) && shifts.length > 0) {
        return 'Shift associated with Driver, cannot delete Driver';
      } else {
        const deletedDriver = await Driver.findOneAndDelete({ NIF: nif });
        return deletedDriver;
      }
    } catch (error) {
      throw error;
    }
  },
};
