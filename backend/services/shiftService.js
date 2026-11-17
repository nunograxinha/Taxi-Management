const { Turno } = require('../models/shift')
const { getMotoristaByNIF } = require('./driverService')
const { getTaxiByLicensePlate } = require('./taxiService')

module.exports = {

    getTurnos: async () => {
        try {
          return await Turno.find();
        } catch (error) {
          throw error;
        }
      },
      
      getTurnoById: async (id) => {
        try {
          return await Turno.findById(id);
        } catch (error) {
          throw error;
        }
      },

      createTurno: async (nif, taxi, start, end) => {
        try {
            const driver = await getMotoristaByNIF(nif);
            if (driver) {
              const shift = new Turno({
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
      
      
      updateTurnoById: async (id, updateData) => {
        try {
          return await Turno.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
        } catch (error) {
          throw error;
        }
      },
      
      deleteTurnoById: async (id) => {
        try {
          return await Turno.findByIdAndDelete(id);
        } catch (error) {
          throw error;
        }
      },

  getTurnosInTimeframe: async (nif, startTime, endTime) => {
    try {
      const driver = await getMotoristaByNIF(nif);
      if (!driver) {
        return [];
      }

      return await Turno.find({
        driver: driver._id,
        start: { $lt: endTime },
        end: { $gt: startTime }
      });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  },

  getAllTurnosInTimeframe: async (startTime, endTime) => {
    try {
      return await Turno.find({
        start: { $lt: endTime },
        end: { $gt: startTime }
      });
    } catch (error) {
      console.error('Error fetching all shifts in timeframe:', error);
      throw error;
    }
  },

  getTurnosByMotoristaNIF: async (nif) => {
    try {
      const driver = await getMotoristaByNIF(nif);

      if (!driver) {
        throw new Error('Driver not found.');
      }

      return await Turno.find({
        driver: driver._id
      });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error; 
    }
  },

  getTurnosByTaxiPlate: async (plate) => {
    try {
      const taxi = await getTaxiByLicensePlate(plate);
      if (!taxi) {
        throw new Error('Taxi not found.');
      }
      return await Turno.find({
        taxi: taxi._id
      });
    } catch (error) {
      console.error('Error fetching turnos:', error);
      throw error; 
    }
  },
}
