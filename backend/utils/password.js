const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;

/**
 * Hash a plaintext password using a unique random 16-byte salt and Node's built-in scrypt.
 * Stored format: `<saltHex>:<derivedKeyHex>`
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a plaintext password against a stored `<saltHex>:<derivedKeyHex>` hash
 * using constant-time comparison (`crypto.timingSafeEqual`).
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) {
    return false;
  }
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN);
  if (keyBuffer.length !== derivedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

/**
 * Constant-time string comparison (used for env-configured secrets/passwords).
 */
function safeCompareStrings(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  hashPassword,
  verifyPassword,
  safeCompareStrings
};
