const { Driver } = require('../models/driver');
const { Taxi } = require('../models/taxi');
const { Client } = require('../models/client');
const { RideRequest } = require('../models/rideRequest');
const { Invoice } = require('../models/invoice');
const { hashPassword } = require('../utils/password');

const defaultDrivers = [
  {
    NIF: '123456789',
    name: 'João Silva',
    gender: 'Male',
    birthYear: 1985,
    drivingLicenseNumber: '123456789',
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
    gender: 'Female',
    birthYear: 1990,
    drivingLicenseNumber: '987654321',
    address: {
      street: 'Rua B',
      doorNumber: '20',
      postalCode: '2000-200',
      city: 'Porto'
    }
  }
];

const defaultTaxis = [
  {
    licensePlate: 'AA-00-AA',
    brand: 'Toyota',
    model: 'Corolla',
    confort: 'Basic',
    purchaseYear: 2020
  },
  {
    licensePlate: 'BB-11-BB',
    brand: 'Mercedes',
    model: 'Classe E',
    confort: 'Luxury',
    purchaseYear: 2022
  }
];

exports.seedInitialData = async () => {
  try {
    // Migrate any legacy Portuguese enum values in existing documents to English
    await Driver.updateMany({ gender: 'Masculino' }, { $set: { gender: 'Male' } });
    await Driver.updateMany({ gender: 'Feminino' }, { $set: { gender: 'Female' } });
    await Client.updateMany({ gender: 'Masculino' }, { $set: { gender: 'Male' } });
    await Client.updateMany({ gender: 'Feminino' }, { $set: { gender: 'Female' } });
    await Invoice.updateMany({ clientGender: 'Masculino' }, { $set: { clientGender: 'Male' } });
    await Invoice.updateMany({ clientGender: 'Feminino' }, { $set: { clientGender: 'Female' } });
    await Taxi.updateMany({ confort: 'Basico' }, { $set: { confort: 'Basic' } });
    await Taxi.updateMany({ confort: 'Luxuoso' }, { $set: { confort: 'Luxury' } });
    await RideRequest.updateMany({ confort: 'Basico' }, { $set: { confort: 'Basic' } });
    await RideRequest.updateMany({ confort: 'Luxuoso' }, { $set: { confort: 'Luxury' } });

    const driverCount = await Driver.countDocuments();
    if (driverCount === 0) {
      const seededDrivers = defaultDrivers.map((d) => ({
        ...d,
        passwordHash: hashPassword('driver123')
      }));
      await Driver.insertMany(seededDrivers);
      console.log('Initial drivers seeded successfully.');
    } else {
      const driversWithoutPassword = await Driver.find({
        $or: [{ passwordHash: { $exists: false } }, { passwordHash: null }, { passwordHash: '' }]
      });
      for (const drv of driversWithoutPassword) {
        drv.passwordHash = hashPassword('driver123');
        await drv.save();
      }
    }

    const taxiCount = await Taxi.countDocuments();
    if (taxiCount === 0) {
      await Taxi.insertMany(defaultTaxis);
      console.log('Initial taxis seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

exports.init_database = async (req, res) => {
  try {
    await exports.seedInitialData();

    res.status(200).json({
      message: 'Database initialized successfully!',
      driversCreated: defaultDrivers.length,
      taxisCreated: defaultTaxis.length
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Error initializing database' });
  }
};
