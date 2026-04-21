// Generate APR1-MD5 hash for testing
// Must match the algorithm in index.html exactly!
// Run: node generate-apr1.js

const crypto = require('crypto');

// Must match the browser's md5Binary function exactly
function md5Binary(value) {
  return crypto.createHash('md5').update(Buffer.from(value, 'latin1')).digest('latin1');
}

const itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function to64(value, length) {
  var result = '';
  while (--length >= 0) {
    result += itoa64[value & 0x3f];
    value >>= 6;
  }
  return result;
}

function apr1(password, salt) {
  // Apache MD5 algorithm - must match browser implementation exactly
  
  var message = password + '$apr1$' + salt;
  var final = md5Binary(password + salt + password);
  var remaining = password.length;

  // Append 4-char chunks of final hash until password is consumed
  while (remaining > 0) {
    message += final.substring(0, remaining > 16 ? 16 : remaining);
    remaining -= 16;
  }

  // Append 'l' or null bytes based on bit position
  for (var bit = password.length; bit > 0; bit >>= 1) {
    message += (bit & 1) ? String.fromCharCode(0) : password.charAt(0);
  }

  final = md5Binary(message);

  // Loop 1000 times
  for (var i = 0; i < 1000; i++) {
    var iteration = '';
    iteration += (i & 1) ? password : final;
    if (i % 3) iteration += salt;
    if (i % 7) iteration += password;
    iteration += (i & 1) ? final : password;
    final = md5Binary(iteration);
  }

  // Encode the final hash
  var passwd = '';
  passwd += to64((final.charCodeAt(0) << 16) | (final.charCodeAt(6) << 8) | final.charCodeAt(12), 4);
  passwd += to64((final.charCodeAt(1) << 16) | (final.charCodeAt(7) << 8) | final.charCodeAt(13), 4);
  passwd += to64((final.charCodeAt(2) << 16) | (final.charCodeAt(8) << 8) | final.charCodeAt(14), 4);
  passwd += to64((final.charCodeAt(3) << 16) | (final.charCodeAt(9) << 8) | final.charCodeAt(15), 4);
  passwd += to64((final.charCodeAt(4) << 16) | (final.charCodeAt(10) << 8) | final.charCodeAt(5), 4);
  passwd += to64(final.charCodeAt(11), 2);

  return '$apr1$' + salt + '$' + passwd;
}

// Generate hash for 'luca' with salt 'test1234'
const hash = apr1('luca', 'test1234');
console.log('Password: luca');
console.log('Salt: test1234');
console.log('Hash:', hash);
console.log('');
console.log('For secret.json:');
console.log(JSON.stringify({ hash }));