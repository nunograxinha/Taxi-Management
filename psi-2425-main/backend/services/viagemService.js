const { Viagem } = require('../models/viagem');
const { Turno } = require('../models/turno');
const { Motorista } = require('../models/motorista');
const { Cliente } = require('../models/cliente');

module.exports = {

    getViagems: async () => {
        try {
            return await Viagem.find().populate('motorista').populate('turno');
        } catch (error) {
        throw error;
        }
    },
    
    getViagemById: async (id) => {
        try {
            return await Viagem.findById(id).populate('motorista').populate('turno');
        } catch (error) {
        throw error;
        }
    },
    
    createViagem: async (body) => {
        try {
            const motorista = await Motorista.findById(body.motorista);
            if (!motorista) {
                throw new Error('Motorista not found');
            }
            const turno = await Turno.findById(body.turno);
            if (!turno) {
                throw new Error('Turno not found');
            }
            const cliente = await Cliente.findById(body.cliente);
            if (!cliente) throw new Error('Cliente not found');

            const viagem = new Viagem(body);
            return await viagem.save();
        } catch (error) {
            throw error;
        }
    },
    
    updateViagemById: async (id, updateData) => {
        try {
            const viagem = await Viagem.findById(id);
            if (!viagem) {
                throw new Error('Viagem não encontrada');
            }
            
            if (updateData.motorista) {
                const motorista = await Motorista.findById(updateData.motorista);
                if (!motorista) {
                    throw new Error('Motorista não encontrado');
                }
            }

            if (updateData.turno) {
                const turno = await Turno.findById(updateData.turno);
                if (!turno) {
                    throw new Error('Turno não encontrado');
                }
            }

            if (updateData.cliente) {
                const cliente = await Cliente.findById(updateData.cliente);
                if (!cliente) throw new Error('Cliente não encontrado');
            }
            
            return await Viagem.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).populate('motorista').populate('turno').exec();
        } catch (error) {
            throw error;
        }
    },
    
    deleteViagemById: async (id) => {
        try {
            const viagem = await Viagem.findByIdAndDelete(id);
            if (!viagem) {
                throw new Error('Viagem não encontrada');
            }
            return viagem;
        } catch (error) {
            throw error;
        }
    },
    
    getViagensByMotorista: async (motoristaId) => {
        return Viagem.find({ motorista: motoristaId });
    },
}