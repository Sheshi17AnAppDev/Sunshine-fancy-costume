#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure initialization key
function generateSecureInitKey() {
    // Create a cryptographically secure random key
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const machineId = require('os').hostname() || 'unknown';
    
    // Combine multiple entropy sources
    const combined = `${timestamp}-${randomBytes}-${machineId}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    // Take first 32 characters for a manageable but secure key
    return hash.substring(0, 32);
}

// Generate the key
const initKey = generateSecureInitKey();

console.log('='.repeat(60));
console.log('SUPER ADMIN INITIALIZATION KEY GENERATOR');
console.log('='.repeat(60));
console.log('');
console.log('Generated Key:', initKey);
console.log('');
console.log('Instructions:');
console.log('1. Add this key to your .env file:');
console.log(`   SUPER_ADMIN_INIT_KEY=${initKey}`);
console.log('');
console.log('2. Keep this key secure and private!');
console.log('3. This key can only be used once for super admin initialization.');
console.log('4. Store it in a safe place for future reference.');
console.log('');
console.log('='.repeat(60));

// Optionally save to a file (comment this out for security)
// const keyFile = path.join(__dirname, 'super-admin-init-key.txt');
// fs.writeFileSync(keyFile, `SUPER_ADMIN_INIT_KEY=${initKey}\nGenerated: ${new Date().toISOString()}`);
// console.log(`Key also saved to: ${keyFile}`);
