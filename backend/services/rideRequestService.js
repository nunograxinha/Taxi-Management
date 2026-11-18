const { RideRequest } = require('../models/rideRequest');
const clientService = require('./clientService');

module.exports = {
  getRideRequests: async () => {
    try {
      const requests = await RideRequest.find().populate('client');
      return requests;
    } catch (error) {
      console.error('Error fetching ride requests:', error);
      throw new Error('Error fetching ride requests');
    }
  },

  deleteRideRequest: async (id) => {
    try {
      const deletedRequest = await RideRequest.findByIdAndDelete(id);
      if (!deletedRequest) {
        throw new Error('Ride request not found');
      }
      return deletedRequest;
    } catch (error) {
      console.error('Error deleting ride request:', error);
      throw new Error('Error deleting ride request');
    }
  },

  getRideRequest: async (id) => {
    try {
      const request = await RideRequest.findById(id).populate('client');
      if (!request) {
        throw new Error('Ride request not found');
      }
      return request;
    } catch (error) {
      console.error('Error fetching ride request by ID:', error);
      throw new Error('Error fetching ride request by ID');
    }
  },

  createRideRequest: async (body) => {
    try {
      const payload = {
        ...body,
        client: body.client
      };
      const client = await clientService.getClientById(payload.client);
      if (!client) {
        throw new Error('Client not found');
      }
      const request = new RideRequest(payload);
      const savedRequest = await request.save();
      return savedRequest;
    } catch (error) {
      console.error('Error creating ride request:', error);
      throw new Error('Error creating ride request');
    }
  },
};
