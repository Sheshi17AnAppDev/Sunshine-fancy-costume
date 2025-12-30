const crypto = require('crypto');

const companyName = 'Kalpapreeth IT Solutions';

const jwtSecret = crypto
    .createHmac('sha256', crypto.randomBytes(32))
    .update(companyName)
    .digest('hex');

console.log('JWT SECRET (save this):', jwtSecret);
