const { Motorista } = require('../models/motorista');
// Adicionar aqui outros modelos como Taxi, etc.

exports.init_database = async (req, res) => {
  try {
    // Exemplo: cria motoristas de teste
    const motoristas = [
      {
        NIF: '123456789',
        name: 'João Silva',
        gender: 'Masculino',
        birthYear: 1985,
        drivingLicenseNumber: 'DL123456',
        address: {
          street: 'Rua A',
          doorNumber: '10',
          postalCode: '1000-100',
          city: 'Lisboa'
        }
      },
      {
        NIF: '987654321',
        name: 'Maria Santos',
        gender: 'Feminino',
        birthYear: 1990,
        drivingLicenseNumber: 'DL654321',
        address: {
          street: 'Rua B',
          doorNumber: '20',
          postalCode: '2000-200',
          city: 'Porto'
        }
      }
    ];

    await Motorista.insertMany(motoristas);

    res.status(200).json({
      message: 'Base de dados inicializada com sucesso!',
      motoristasCriados: motoristas.length
    });
  } catch (error) {
    console.error('Erro a inicializar a base de dados:', error);
    res.status(500).json({ error: 'Erro ao inicializar a base de dados' });
  }
};
