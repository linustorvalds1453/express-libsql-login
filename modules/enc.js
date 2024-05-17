const crypto = require('crypto');

const STATIC_KEY = process.env.KEY;


function encrypt(plaintext) {
  const cipher = crypto.createCipheriv('aes-256-ecb', Buffer.from(STATIC_KEY), null);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}




module.exports = encrypt
