const { Taxi } = require('../models/taxi')

module.exports = {

    getTaxis: async () => {
        try {
            return await Taxi.find();
        } catch (error) {
            throw error;
        }
    },

    getTaxiByLicensePlate: async (plate) => {
        try {
            return await Taxi.findOne({ licensePlate: plate });
        } catch (error) {
            throw error;
        }
    },

    getTaxiByID: async (id) => {
        try {
            return await Taxi.findById(id);
        } catch (error) {
            throw error;
        }
    },


    createTaxi: async (body) => {
        try {
            console.log(body)
            const taxi = new Taxi(body);
            return await taxi.save();
        } catch (error) {
            throw error;
        }
    },

    updateTaxiByLicensePlate: async (plate, updateData) => {
        try {
            return await Taxi.findOneAndUpdate(
                { licensePlate: plate },
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw error;
        }
    },

    deleteTaxiByLicensePlate: async (plate) => {
        try {
            const turnoService = require('./turnoService'); 
            const turno = await turnoService.getTurnosByTaxiPlate(plate);
            if (Array.isArray(turno) && turno.length > 0) {
                return "Turno associado ao Taxi, não é possível eliminar o Taxi";
            }else{
                return await Taxi.findOneAndDelete({ licensePlate: plate });
            }
        } catch (error) {
            throw error;
        }
    },
}