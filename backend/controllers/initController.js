const { Motorista } = require('../models/motorista');
// Add other models such as Taxi, etc. here

exports.init_database = async (req, res) => {
  try {
    // Example: create sample drivers
    const motoristas = [
      {
        NIF: '123456789',
        name: 'John Smith',
        gender: 'Male',
        birthYear: 1985,
        drivingLicenseNumber: 'DL123456',
        address: {
          street: 'Street A',
          doorNumber: '10',
          postalCode: '1000-100',
          city: 'Lisbon'
        }
      },
      {
        NIF: '987654321',
        name: 'Mary Johnson',
        gender: 'Female',
        birthYear: 1990,
        drivingLicenseNumber: 'DL654321',
        address: {
          street: 'Street B',
          doorNumber: '20',
          postalCode: '2000-200',
          city: 'Porto'
        }
      }
    ];

    await Motorista.insertMany(motoristas);

    res.status(200).json({
      message: 'Database initialized successfully!',
      driversCreated: motoristas.length
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Error initializing database' });
  }
};
