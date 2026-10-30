const crypto = require('crypto');

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates an alphanumeric ID of specified length (default 6 characters, uppercase).
 * e.g., 'A8F9K2', '3B7X1Q'
 */
function generateUserId(length = 6) {
  const bytes = crypto.randomBytes(length);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
  }
  return id;
}

module.exports = { generateUserId };
