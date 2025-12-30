const crypto = require('crypto');

// Generate secure key
function generateKey() {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const combined = timestamp + randomBytes;
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32);
}

const key = generateKey();

console.log('='.repeat(50));
console.log('SUPER ADMIN INITIALIZATION KEY');
console.log('='.repeat(50));
console.log('');
console.log('Your secure key:', key);
console.log('');
console.log('Add this to your .env file:');
console.log('SUPER_ADMIN_INIT_KEY=' + key);
console.log('');
console.log('Keep this key private and secure!');
console.log('='.repeat(50));
