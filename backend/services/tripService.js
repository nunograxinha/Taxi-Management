const { Trip } = require('../models/trip');
const { Shift } = require('../models/shift');
const { Driver } = require('../models/driver');
const { Client } = require('../models/client');
const { getIO } = require('../socket');

async function recalculateDriverRating(driverId) {
  if (!driverId) {
    return { ratingAverage: 0, ratingCount: 0 };
  }

  const ratedTrips = await Trip.find({
    driver: driverId,
    rating: { $gte: 1, $lte: 5 }
  }).select('rating');

  const ratingCount = ratedTrips.length;
  const sum = ratedTrips.reduce((acc, t) => acc + Number(t.rating || 0), 0);
  const ratingAverage = ratingCount > 0 ? Math.round((sum / ratingCount) * 10) / 10 : 0;

  await Driver.findByIdAndUpdate(driverId, { ratingAverage, ratingCount });

  const io = getIO();
  if (io) {
    io.emit('driver:ratingUpdated', {
      driverId: String(driverId),
      ratingAverage,
      ratingCount
    });
  }

  return { ratingAverage, ratingCount };
}

module.exports = {
  recalculateDriverRating,

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
      const parsedRating = body.rating !== undefined && body.rating !== null ? Number(body.rating) : null;
      const validRating = Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5 ? parsedRating : null;
      const payload = {
        ...body,
        driver: body.driver,
        shift: body.shift,
        client: body.client,
        price: body.price,
        rating: validRating,
        ratingComment: typeof body.ratingComment === 'string' ? body.ratingComment.trim().slice(0, 500) : ''
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
      const savedTrip = await trip.save();
      if (savedTrip.rating) {
        await recalculateDriverRating(savedTrip.driver);
      }
      return savedTrip;
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

  rateTrip: async (id, rating, ratingComment, requester) => {
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      const err = new Error('Rating must be an integer between 1 and 5.');
      err.statusCode = 400;
      throw err;
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      const err = new Error('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    const requesterClientId = requester?.clientId || requester?.id;
    if (requester?.role === 'client' && requesterClientId && String(trip.client) !== String(requesterClientId)) {
      const err = new Error('You can only rate your own trips.');
      err.statusCode = 403;
      throw err;
    }

    trip.rating = numericRating;
    trip.ratingComment = typeof ratingComment === 'string' ? ratingComment.trim().slice(0, 500) : '';
    await trip.save();

    const stats = await recalculateDriverRating(trip.driver);
    const populatedTrip = await Trip.findById(trip._id).populate('driver').populate('shift');
    return {
      trip: populatedTrip,
      ratingAverage: stats.ratingAverage,
      ratingCount: stats.ratingCount
    };
  },

  deleteTripById: async (id) => {
    try {
      const trip = await Trip.findByIdAndDelete(id);
      if (!trip) {
        throw new Error('Trip not found');
      }
      if (trip.rating) {
        await recalculateDriverRating(trip.driver);
      }
      return trip;
    } catch (error) {
      throw error;
    }
  },

  getTripsByDriver: async (driverId) => {
    return Trip.find({ driver: driverId })
      .populate('client', 'name')
      .sort({ exitTime: -1, entryTime: -1 });
  },
};
