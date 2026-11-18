const { Shift } = require('../models/shift');
const { getDriverByNIF } = require('./driverService');
const { getTaxiByLicensePlate } = require('./taxiService');

module.exports = {
  getShifts: async () => {
    try {
      return await Shift.find();
    } catch (error) {
      throw error;
    }
  },

  getShiftById: async (id) => {
    try {
      return await Shift.findById(id);
    } catch (error) {
      throw error;
    }
  },

  createShift: async (nif, taxi, start, end) => {
    try {
      const driver = await getDriverByNIF(nif);
      if (driver) {
        const shift = new Shift({
          driver: driver._id,
          taxi: taxi,
          start: new Date(start),
          end: new Date(end)
        });
        return await shift.save();
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  updateShiftById: async (id, updateData) => {
    try {
      return await Shift.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    } catch (error) {
      throw error;
    }
  },

  deleteShiftById: async (id) => {
    try {
      return await Shift.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  },

  getShiftsInTimeframe: async (nif, startTime, endTime) => {
    try {
      const driver = await getDriverByNIF(nif);
      if (!driver) {
        return [];
      }

      return await Shift.find({
        driver: driver._id,
        start: { $lt: endTime },
        end: { $gt: startTime }
      });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  },

  getAllShiftsInTimeframe: async (startTime, endTime) => {
    try {
      return await Shift.find({
        start: { $lt: endTime },
        end: { $gt: startTime }
      });
    } catch (error) {
      console.error('Error fetching all shifts in timeframe:', error);
      throw error;
    }
  },

  getShiftsByDriverNIF: async (nif) => {
    try {
      const driver = await getDriverByNIF(nif);
      if (!driver) {
        throw new Error('Driver not found.');
      }

      return await Shift.find({
        driver: driver._id
      });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  },

  getShiftsByTaxiPlate: async (plate) => {
    try {
      const taxi = await getTaxiByLicensePlate(plate);
      if (!taxi) {
        throw new Error('Taxi not found.');
      }
      return await Shift.find({
        taxi: taxi._id
      });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  },
};
