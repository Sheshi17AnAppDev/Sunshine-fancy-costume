#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('SUPER ADMIN ENVIRONMENT SETUP');
console.log('='.repeat(60));
console.log('');
console.log('This script will help you set up the super admin credentials.');
console.log('Add these environment variables to your .env file:');
console.log('');

// Generate example credentials
const exampleEmail = 'admin@sunshine.com';
const examplePassword = 'SuperAdmin123!'; // You should change this
const exampleName = 'Super Admin';

console.log('SUPER_ADMIN_EMAIL=' + exampleEmail);
console.log('SUPER_ADMIN_PASSWORD=' + examplePassword);
console.log('SUPER_ADMIN_NAME=' + exampleName);
console.log('');
console.log('Instructions:');
console.log('1. Open your .env file');
console.log('2. Add the lines above with your preferred credentials');
console.log('3. Restart your server');
console.log('4. The super admin will be automatically created/updated');
console.log('');
console.log('Security Notes:');
console.log('- Use a strong, unique password');
console.log('- Keep these credentials secure and private');
console.log('- The super admin has full system access');
console.log('');
console.log('='.repeat(60));
