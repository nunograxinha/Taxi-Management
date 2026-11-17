const { Viagem } = require('../models/trip');
const { Turno } = require('../models/shift');
const { Motorista } = require('../models/driver');
const { Cliente } = require('../models/client');

module.exports = {

    getViagems: async () => {
        try {
            return await Viagem.find().populate('driver').populate('shift');
        } catch (error) {
        throw error;
        }
    },
    
    getViagemById: async (id) => {
        try {
            return await Viagem.findById(id).populate('driver').populate('shift');
        } catch (error) {
        throw error;
        }
    },
    
    createViagem: async (body) => {
        try {
            const payload = {
                ...body,
                driver: body.driver || body.motorista,
                shift: body.shift || body.turno,
                client: body.client || body.cliente,
                price: body.price !== undefined ? body.price : body.preco
            };
            const driver = await Motorista.findById(payload.driver);
            if (!driver) {
                throw new Error('Driver not found');
            }
            const shift = await Turno.findById(payload.shift);
            if (!shift) {
                throw new Error('Shift not found');
            }
            const client = await Cliente.findById(payload.client);
            if (!client) throw new Error('Client not found');

            const trip = new Viagem(payload);
            return await trip.save();
        } catch (error) {
            throw error;
        }
    },
    
    updateViagemById: async (id, updateData) => {
        try {
            const trip = await Viagem.findById(id);
            if (!trip) {
                throw new Error('Trip not found');
            }
            
            const driverId = updateData.driver || updateData.motorista;
            if (driverId) {
                const driver = await Motorista.findById(driverId);
                if (!driver) {
                    throw new Error('Driver not found');
                }
            }

            const shiftId = updateData.shift || updateData.turno;
            if (shiftId) {
                const shift = await Turno.findById(shiftId);
                if (!shift) {
                    throw new Error('Shift not found');
                }
            }

            const clientId = updateData.client || updateData.cliente;
            if (clientId) {
                const client = await Cliente.findById(clientId);
                if (!client) throw new Error('Client not found');
            }
            
            return await Viagem.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).populate('driver').populate('shift').exec();
        } catch (error) {
            throw error;
        }
    },
    
    deleteViagemById: async (id) => {
        try {
            const trip = await Viagem.findByIdAndDelete(id);
            if (!trip) {
                throw new Error('Trip not found');
            }
            return trip;
        } catch (error) {
            throw error;
        }
    },
    
    getViagensByMotorista: async (driverId) => {
        return Viagem.find({ driver: driverId });
    },
}