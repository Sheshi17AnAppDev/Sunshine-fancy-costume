const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'dev_secret_fallback_12345';
    // console.log('Gen Token Secret:', secret); // Debug
    if (!secret) {
        console.error('CRITICAL: JWT Secret is faulty:', secret);
        throw new Error('JWT Secret missing');
    }
    return jwt.sign({ id }, secret, {
        expiresIn: '30d'
    });
};

module.exports = generateToken;
