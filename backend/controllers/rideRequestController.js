const crypto = require('crypto');
const rideRequestService = require('../services/rideRequestService');
const { RideRequest } = require('../models/rideRequest');
const { Driver } = require('../models/driver');
const { Taxi } = require('../models/taxi');
const { getIO, getLastDriverLocation } = require('../socket');

exports.getRideRequests = async (req, res) => {
  try {
    const requests = await rideRequestService.getRideRequests();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteRideRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRequest = await rideRequestService.deleteRideRequest(id);
    const io = getIO();
    if (io) {
      io.to(String(id)).emit('pedido:deleted', { id });
      io.emit('pedido:deleted', { id });
    }
    res.status(200).json(deletedRequest);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createRideRequest = async (req, res) => {
  try {
    const newRequest = await rideRequestService.createRideRequest(req.body);
    const io = getIO();
    if (io) {
      io.emit('pedido:created', newRequest);
    }
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating ride request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getRideRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const rideRequest = await RideRequest.findById(id).populate('client');
    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }
    res.status(200).json(rideRequest);
  } catch (error) {
    console.error('Error fetching ride request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.acceptRideRequestDriver = async (req, res) => {
  const { id } = req.params;
  const { driverId, taxi, distanceKmToDriver, clientAccepted } = req.body;

  try {
    const existingRequest = await RideRequest.findById(id);
    if (!existingRequest) return res.status(404).json({ error: 'Ride request not found' });

    if (taxi) {
      const mongoose = require('mongoose');
      const taxiDoc = mongoose.Types.ObjectId.isValid(taxi)
        ? await Taxi.findById(taxi)
        : await Taxi.findOne({ licensePlate: taxi });
      if (taxiDoc) {
        const capacity = taxiDoc.passengerCapacity ?? 4;
        if (existingRequest.numberOfPeople > capacity) {
          return res.status(400).json({
            error: `Taxi capacity (${capacity} passengers) is insufficient for ${existingRequest.numberOfPeople} passengers.`
          });
        }
      }
    }

    const updated = await RideRequest.findByIdAndUpdate(
      id,
      { driverId, taxi, distanceKmToDriver, clientAccepted },
      { new: true }
    ).populate('client');

    if (!updated) return res.status(404).json({ error: 'Ride request not found' });
    const io = getIO();
    if (io) {
      io.to(String(id)).emit('pedido:driverAccepted', updated);
      io.emit('pedido:updated', updated);
    }
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error accepting ride request:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.requestDriver = async (req, res) => {
  const { id } = req.params;
  const timeoutMs = 5 * 60 * 1000;
  const intervalMs = 15 * 1000;
  let elapsed = 0;

  const cleanup = () => {
    clearInterval(intervalCheck);
    clearTimeout(timeoutTimer);
  };

  req.on('close', () => cleanup());

  const intervalCheck = setInterval(async () => {
    try {
      elapsed += intervalMs;
      const rideRequest = await RideRequest.findById(id);

      if (!rideRequest) {
        cleanup();
        if (!res.headersSent) {
          return res.status(404).json({ message: 'Ride request not found or cancelled' });
        }
        return;
      }

      if (rideRequest.driverId) {
        cleanup();
        if (!res.headersSent) {
          return res.status(200).json({ driverId: rideRequest.driverId });
        }
        return;
      }

      if (elapsed >= timeoutMs) {
        clearInterval(intervalCheck);
      }
    } catch (err) {
      cleanup();
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Error checking driver status' });
      }
    }
  }, intervalMs);

  const timeoutTimer = setTimeout(() => {
    cleanup();
    if (!res.headersSent) {
      return res.status(202).json({ driverId: null, message: 'No driver assigned yet' });
    }
  }, timeoutMs);
};

exports.clientConfirm = async (req, res) => {
  const { id } = req.params;
  const timeoutMs = 5 * 60 * 1000;
  const intervalMs = 15 * 1000;
  let elapsed = 0;

  const cleanup = () => {
    clearInterval(intervalCheck);
    clearTimeout(timeoutTimer);
  };

  req.on('close', () => cleanup());

  const intervalCheck = setInterval(async () => {
    try {
      elapsed += intervalMs;
      const rideRequest = await RideRequest.findById(id);

      if (!rideRequest || !rideRequest.driverId) {
        cleanup();
        if (!res.headersSent) {
          return res.status(200).json({ confirmed: false, rejected: true, message: 'Client rejected or cancelled' });
        }
        return;
      }

      if (rideRequest.clientAccepted) {
        cleanup();
        if (!res.headersSent) {
          return res.status(200).json({ confirmed: true, message: 'Client confirmed' });
        }
        return;
      }

      if (elapsed >= timeoutMs) {
        clearInterval(intervalCheck);
      }
    } catch (err) {
      cleanup();
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Error checking client status' });
      }
    }
  }, intervalMs);

  const timeoutTimer = setTimeout(() => {
    cleanup();
    if (!res.headersSent) {
      return res.status(202).json({ confirmed: false, rejected: false, message: 'Client did not answer' });
    }
  }, timeoutMs);
};

exports.acceptRideRequestClient = async (req, res) => {
  const { id } = req.params;
  const { clientAccepted } = req.body;
  try {
    const updated = await RideRequest.findByIdAndUpdate(
      id,
      { clientAccepted },
      { new: true }
    ).populate('client');

    if (!updated) return res.status(404).json({ error: 'Ride request not found' });
    const io = getIO();
    if (io) {
      io.to(String(id)).emit('pedido:clientConfirmed', updated);
      io.to(String(id)).emit('pedido:updated', updated);
      io.emit('pedido:updated', updated);
    }
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error accepting ride request (client):', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.rejectRideRequest = async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;
  const update = {
    $set: {
      driverId: null,
      clientAccepted: false,
      taxi: null,
      distanceKmToDriver: null
    }
  };

  if (driverId) {
    update.$addToSet = { rejectedDrivers: driverId };
  }

  try {
    const updated = await RideRequest.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).populate('client');

    if (!updated) return res.status(404).json({ error: 'Ride request not found' });
    const io = getIO();
    if (io) {
      io.to(String(id)).emit('pedido:clientRejected', updated);
      io.emit('pedido:updated', updated);
    }
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error rejecting ride request:', err);
    res.status(500).json({ error: 'Error rejecting ride request' });
  }
};

exports.updateRideRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await RideRequest.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    ).populate('client');
    if (!updated) return res.status(404).json({ error: 'Ride request not found' });
    const io = getIO();
    if (io) {
      io.to(String(id)).emit('pedido:updated', updated);
      io.emit('pedido:updated', updated);
    }
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating ride request:', err);
    res.status(500).json({ error: 'Error updating ride request' });
  }
};

exports.createShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const rideRequest = await RideRequest.findById(id).populate('client');
    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    if (
      req.user &&
      req.user.role === 'client' &&
      req.user.id &&
      rideRequest.client &&
      String(rideRequest.client._id) !== String(req.user.id)
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (rideRequest.endTime) {
      return res.status(400).json({ error: 'Cannot share a trip that has already ended.' });
    }

    if (!rideRequest.shareToken) {
      rideRequest.shareToken = crypto.randomBytes(16).toString('hex');
      await rideRequest.save();
    }

    res.status(200).json({ shareToken: rideRequest.shareToken });
  } catch (err) {
    console.error('Error creating share link:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getSharedTrip = async (req, res) => {
  try {
    const { shareToken } = req.params;
    if (!shareToken || !/^[a-f0-9]{32}$/i.test(shareToken)) {
      return res.status(404).json({ expired: true, error: 'Shared trip link not found or expired.' });
    }

    const rideRequest = await RideRequest.findOne({ shareToken });
    if (!rideRequest) {
      return res.status(404).json({ expired: true, error: 'Shared trip link not found or expired.' });
    }

    if (rideRequest.endTime) {
      return res.status(410).json({
        expired: true,
        error: 'This shared trip link has expired because the trip has ended.',
        endTime: rideRequest.endTime
      });
    }

    let driverName = null;
    if (rideRequest.driverId) {
      const driver = await Driver.findById(rideRequest.driverId).select('name');
      driverName = driver ? driver.name : null;
    }

    let taxi = null;
    if (rideRequest.taxi) {
      const taxiDoc = await Taxi.findById(rideRequest.taxi).select('licensePlate brand model');
      if (taxiDoc) {
        taxi = {
          licensePlate: taxiDoc.licensePlate,
          brand: taxiDoc.brand,
          model: taxiDoc.model
        };
      }
    }

    res.status(200).json({
      trackingRoom: String(rideRequest._id),
      entryAddress: rideRequest.entryAddress,
      exitAddress: rideRequest.exitAddress,
      confort: rideRequest.confort,
      distanceKmToDriver: rideRequest.distanceKmToDriver,
      startTime: rideRequest.startTime,
      endTime: rideRequest.endTime,
      driverName,
      taxi,
      taxiLocation: getLastDriverLocation(rideRequest._id)
    });
  } catch (err) {
    console.error('Error fetching shared trip:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
