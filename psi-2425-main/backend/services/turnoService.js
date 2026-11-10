const { Turno } = require('../models/turno')
const { getMotoristaByNIF } = require('./motoristaService')
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
            const motorista = await getMotoristaByNIF(nif);
            if (motorista) {
              const turno = new Turno({
                motorista: motorista._id, 
                taxi: taxi,           
                start: new Date(start), 
                end: new Date(end)      
              });
              console.log("turno:",turno);
              return await turno.save();
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
      const motorista = await getMotoristaByNIF(nif);
      if (!motorista) {
        return await Turno.find({
        start: { $lt: endTime },
        end: { $gt: startTime }
      });
      }

      console.log('Found Motorista:', motorista); 
      return await Turno.find({
        motorista: motorista._id,
        start: { $lt: endTime },
        end: { $gt: startTime }
      });
    } catch (error) {
      console.error('Error fetching turnos:', error);
      throw error;
    }
  },

  getTurnosByMotoristaNIF: async (nif) => {
    try {
      const motorista = await getMotoristaByNIF(nif);

      if (!motorista) {
        throw new Error('Motorista não encontrado.');
      }

      return await Turno.find({
        motorista: motorista._id
      });
    } catch (error) {
      console.error('Error fetching turnos:', error);
      throw error; 
    }
  },

  getTurnosByTaxiPlate: async (plate) => {
    try {
      const taxi = await getTaxiByLicensePlate(plate);
      if (!taxi) {
        throw new Error('Taxi não encontrado.');
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
