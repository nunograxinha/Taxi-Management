const { Driver } = require('../models/driver');
const { Client } = require('../models/client');
const { signToken } = require('../utils/jwt');
const { hashPassword, verifyPassword, safeCompareStrings } = require('../utils/password');
const { sanitizeProfilePhoto } = require('../utils/photoValidation');

const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || 'admin123';

exports.loginManager = async (req, res) => {
  const { password } = req.body || {};
  if (!password || !safeCompareStrings(password, MANAGER_PASSWORD)) {
    return res.status(401).json({ error: 'Invalid manager password' });
  }

  const token = signToken({ role: 'manager' });
  res.status(200).json({
    token,
    role: 'manager'
  });
};

exports.loginDriver = async (req, res) => {
  try {
    const { nif, password } = req.body || {};
    if (!nif || !password) {
      return res.status(400).json({ error: 'Driver NIF and password are required' });
    }

    const driver = await Driver.findOne({ NIF: String(nif).trim() }).select('+passwordHash');
    if (!driver || !verifyPassword(password, driver.passwordHash)) {
      return res.status(401).json({ error: 'Invalid NIF or password' });
    }

    const token = signToken({
      role: 'driver',
      nif: driver.NIF,
      driverId: String(driver._id),
      name: driver.name
    });

    res.status(200).json({
      token,
      role: 'driver',
      nif: driver.NIF,
      driverId: driver._id,
      name: driver.name
    });
  } catch (error) {
    console.error('Error authenticating driver:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.loginClient = async (req, res) => {
  try {
    const { nif, password } = req.body || {};
    if (!nif || !password) {
      return res.status(400).json({ error: 'Client NIF and password are required' });
    }

    const clients = await Client.find({ NIF: String(nif).trim() }).select('+passwordHash');
    const matchedClient = clients.find((c) => verifyPassword(password, c.passwordHash));

    if (!matchedClient) {
      return res.status(401).json({ error: 'Invalid NIF or password' });
    }

    const token = signToken({
      role: 'client',
      clientId: String(matchedClient._id),
      nif: matchedClient.NIF,
      name: matchedClient.name
    });

    res.status(200).json({
      token,
      role: 'client',
      client: {
        _id: matchedClient._id,
        NIF: matchedClient.NIF,
        name: matchedClient.name,
        gender: matchedClient.gender,
        profilePhoto: matchedClient.profilePhoto || null
      }
    });
  } catch (error) {
    console.error('Error authenticating client:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.registerClient = async (req, res) => {
  try {
    const { NIF, name, gender, password, profilePhoto } = req.body || {};
    if (!NIF || !name || !gender || !password) {
      return res.status(400).json({ error: 'NIF, name, gender, and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let sanitizedPhoto;
    try {
      sanitizedPhoto = sanitizeProfilePhoto(profilePhoto);
    } catch (photoError) {
      return res.status(photoError.statusCode || 400).json({ error: photoError.message });
    }

    const existingWithPassword = await Client.findOne({ NIF: String(NIF).trim() }).select('+passwordHash');
    if (existingWithPassword && existingWithPassword.passwordHash) {
      return res.status(409).json({ error: 'A client account with this NIF already exists. Please sign in.' });
    }

    let clientDoc;
    if (existingWithPassword) {
      existingWithPassword.name = name;
      existingWithPassword.gender = gender;
      existingWithPassword.passwordHash = hashPassword(password);
      if (sanitizedPhoto !== undefined) {
        existingWithPassword.profilePhoto = sanitizedPhoto;
      }
      clientDoc = await existingWithPassword.save();
    } else {
      clientDoc = await Client.create({
        NIF: String(NIF).trim(),
        name,
        gender,
        passwordHash: hashPassword(password),
        ...(sanitizedPhoto !== undefined ? { profilePhoto: sanitizedPhoto } : {})
      });
    }

    const token = signToken({
      role: 'client',
      clientId: String(clientDoc._id),
      nif: clientDoc.NIF,
      name: clientDoc.name
    });

    res.status(201).json({
      token,
      role: 'client',
      client: {
        _id: clientDoc._id,
        NIF: clientDoc.NIF,
        name: clientDoc.name,
        gender: clientDoc.gender,
        profilePhoto: clientDoc.profilePhoto || null
      }
    });
  } catch (error) {
    console.error('Error registering client:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.changeDriverPassword = async (req, res) => {
  try {
    if (req.user?.role !== 'driver' || !req.user?.driverId) {
      return res.status(403).json({ error: 'Only authenticated drivers can change their password' });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const driver = await Driver.findById(req.user.driverId).select('+passwordHash');
    if (!driver || !verifyPassword(currentPassword, driver.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    driver.passwordHash = hashPassword(newPassword);
    await driver.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing driver password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};
