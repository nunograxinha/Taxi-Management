const MAX_PROFILE_PHOTO_LENGTH = 350000;
const ALLOWED_IMAGE_DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i;

function sanitizeProfilePhoto(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    const err = new Error('Profile photo must be a valid image.');
    err.statusCode = 400;
    throw err;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_PROFILE_PHOTO_LENGTH) {
    const err = new Error('Profile photo is too large. Please choose a smaller image.');
    err.statusCode = 400;
    throw err;
  }

  if (!ALLOWED_IMAGE_DATA_URL_RE.test(trimmed)) {
    const err = new Error('Profile photo must be a valid JPEG, PNG, or WebP image.');
    err.statusCode = 400;
    throw err;
  }

  return trimmed;
}

module.exports = {
  MAX_PROFILE_PHOTO_LENGTH,
  sanitizeProfilePhoto
};
