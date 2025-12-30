const express = require('express');
const router = express.Router();
const { adminLogin, getAdminProfile, updateCredentials } = require('../controllers/adminAuthController');
const { setupSuperAdminFromEnv } = require('../controllers/superAdminController');
const { protect } = require('../middleware/adminAuthMiddleware');

// Admin authentication routes
router.post('/login', adminLogin);
router.get('/profile', protect, getAdminProfile);
router.put('/credentials', protect, updateCredentials);

// Legacy initialization route - redirects to environment setup
router.post('/init', setupSuperAdminFromEnv);

module.exports = router;
