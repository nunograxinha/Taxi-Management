const { Motorista } = require('../models/motorista');
const { hashPassword } = require('../utils/password');

module.exports = {

    getMotoristas: async () => {
    try {
      const motoristas = await Motorista.find();
      return motoristas;
    } catch (error) {
      throw error;
    }
  },
  
  createMotorista: async (body) => {
    try {
      const data = { ...body };
      const plainPassword = data.password || 'driver123';
      delete data.password;
      data.passwordHash = hashPassword(plainPassword);

      const motorista = new Motorista(data);
      const savedmotorista = await motorista.save();
      const result = savedmotorista.toObject();
      delete result.passwordHash;
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getMotoristaByNIF: async (nif) => {
    try {
      const motorista = await Motorista.findOne({ NIF: nif });
      return motorista;
    } catch (error) {
      throw error;
    }
  },

  getMotoristaById: async (id) => {
    try {
      const motorista = await Motorista.findOne({ _id: id });
      return motorista;
    } catch (error) {
      throw error;
    }
  },
  
  updateMotoristaByNIF: async (nif, updateData) => {
    try {
      const updatedMotorista = await Motorista.findOneAndUpdate(
        { NIF: nif }, 
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return updatedMotorista;
    } catch (error) {
      throw error;
    }
  },
  
  deleteMotoristaByNIF: async (nif) => {
    try {
      const turnoService = require('./turnoService'); 
      const turno = await turnoService.getTurnosByMotoristaNIF(nif);
      if(Array.isArray(turno) && turno.length > 0){
        return "Shift associated with Driver, cannot delete Driver";
      }else{
        const deletedMotorista = await Motorista.findOneAndDelete({ NIF: nif });
        return deletedMotorista;
    }
    } catch (error) {
      throw error;
    }
  },
}