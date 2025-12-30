#!/usr/bin/env node

const crypto = require('crypto');

// Generate secure password
function generateSecurePassword(length = 12) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)];
    password += '0123456789'[crypto.randomInt(10)];
    password += '!@#$%^&*'[crypto.randomInt(8)];
    
    // Fill remaining length
    for (let i = 4; i < length; i++) {
        password += charset[crypto.randomInt(charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

console.log('='.repeat(60));
console.log('ADMIN CREDENTIALS GENERATOR');
console.log('='.repeat(60));
console.log('');

// Generate credentials
const adminEmail = 'admin@sunshine.com';
const adminPassword = generateSecurePassword(16);
const adminName = 'Super Admin';

console.log('Generated Secure Admin Credentials:');
console.log('');
console.log('Email:    ' + adminEmail);
console.log('Password: ' + adminPassword);
console.log('Name:     ' + adminName);
console.log('');
console.log('Add these to your .env file:');
console.log('');
console.log('SUPER_ADMIN_EMAIL=' + adminEmail);
console.log('SUPER_ADMIN_PASSWORD=' + adminPassword);
console.log('SUPER_ADMIN_NAME=' + adminName);
console.log('');
console.log('Security Features:');
console.log('- 16-character password with mixed case, numbers, and symbols');
console.log('- Cryptographically secure random generation');
console.log('- Strong password requirements enforced');
console.log('');
console.log('Next Steps:');
console.log('1. Add the above lines to your .env file');
console.log('2. Restart your server');
console.log('3. Login with these credentials at /admin/login');
console.log('4. Change the password after first login if desired');
console.log('');
console.log('='.repeat(60));
