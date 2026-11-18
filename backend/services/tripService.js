const { Trip } = require('../models/trip');
const { Shift } = require('../models/shift');
const { Driver } = require('../models/driver');
const { Client } = require('../models/client');

module.exports = {
  getTrips: async () => {
    try {
      return await Trip.find().populate('driver').populate('shift');
    } catch (error) {
      throw error;
    }
  },

  getTripById: async (id) => {
    try {
      return await Trip.findById(id).populate('driver').populate('shift');
    } catch (error) {
      throw error;
    }
  },

  createTrip: async (body) => {
    try {
      const payload = {
        ...body,
        driver: body.driver,
        shift: body.shift,
        client: body.client,
        price: body.price
      };
      const driver = await Driver.findById(payload.driver);
      if (!driver) {
        throw new Error('Driver not found');
      }
      const shift = await Shift.findById(payload.shift);
      if (!shift) {
        throw new Error('Shift not found');
      }
      const client = await Client.findById(payload.client);
      if (!client) throw new Error('Client not found');

      const trip = new Trip(payload);
      return await trip.save();
    } catch (error) {
      throw error;
    }
  },

  updateTripById: async (id, updateData) => {
    try {
      const trip = await Trip.findById(id);
      if (!trip) {
        throw new Error('Trip not found');
      }

      if (updateData.driver) {
        const driver = await Driver.findById(updateData.driver);
        if (!driver) {
          throw new Error('Driver not found');
        }
      }

      if (updateData.shift) {
        const shift = await Shift.findById(updateData.shift);
        if (!shift) {
          throw new Error('Shift not found');
        }
      }

      if (updateData.client) {
        const client = await Client.findById(updateData.client);
        if (!client) throw new Error('Client not found');
      }

      return await Trip.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
        .populate('driver')
        .populate('shift')
        .exec();
    } catch (error) {
      throw error;
    }
  },

  deleteTripById: async (id) => {
    try {
      const trip = await Trip.findByIdAndDelete(id);
      if (!trip) {
        throw new Error('Trip not found');
      }
      return trip;
    } catch (error) {
      throw error;
    }
  },

  getTripsByDriver: async (driverId) => {
    return Trip.find({ driver: driverId });
  },
};
