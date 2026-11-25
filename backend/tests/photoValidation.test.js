const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MAX_PROFILE_PHOTO_LENGTH, sanitizeProfilePhoto } = require('../utils/photoValidation');

describe('Profile photo validation', () => {
  it('preserves undefined for partial updates', () => {
    assert.equal(sanitizeProfilePhoto(undefined), undefined);
  });

  it('clears photo when null, empty, or whitespace', () => {
    assert.equal(sanitizeProfilePhoto(null), null);
    assert.equal(sanitizeProfilePhoto(''), null);
    assert.equal(sanitizeProfilePhoto('   '), null);
  });

  it('accepts valid JPEG, PNG, and WebP base64 data URLs', () => {
    const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const png = '  data:image/png;base64,iVBORw0KGgo=  ';
    const webp = 'data:image/webp;base64,UklGRh4AAABXRUJQ';

    assert.equal(sanitizeProfilePhoto(jpeg), jpeg);
    assert.equal(sanitizeProfilePhoto(png), png.trim());
    assert.equal(sanitizeProfilePhoto(webp), webp);
  });

  it('rejects SVG, non-image URLs, non-strings, and oversized images with statusCode 400', () => {
    const invalidInputs = [
      'data:image/svg+xml;base64,PHN2Zy8+',
      'https://example.com/avatar.jpg',
      'not-an-image',
      12345,
      `data:image/jpeg;base64,${'A'.repeat(MAX_PROFILE_PHOTO_LENGTH + 1)}`
    ];

    for (const input of invalidInputs) {
      assert.throws(
        () => sanitizeProfilePhoto(input),
        (err) => err instanceof Error && err.statusCode === 400
      );
    }
  });
});
