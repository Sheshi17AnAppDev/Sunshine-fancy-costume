const express = require('express');
const router = express.Router();
const {
    setupSuperAdminFromEnv,
    createAdmin,
    getAllAdmins,
    updateAdminPermissions,
    toggleAdminStatus,
    deleteAdmin
} = require('../controllers/superAdminController');
const { protect, requireSuperAdmin } = require('../middleware/adminAuthMiddleware');

// Setup super admin from environment variables (internal use)
router.post('/auth/setup-super-admin', setupSuperAdminFromEnv);

// Admin management routes (super admin only)
router.post('/admins/create', protect, requireSuperAdmin, createAdmin);
router.get('/admins', protect, requireSuperAdmin, getAllAdmins);
router.put('/admins/:id/permissions', protect, requireSuperAdmin, updateAdminPermissions);
router.put('/admins/:id/toggle', protect, requireSuperAdmin, toggleAdminStatus);
router.delete('/admins/:id', protect, requireSuperAdmin, deleteAdmin);

module.exports = router;
