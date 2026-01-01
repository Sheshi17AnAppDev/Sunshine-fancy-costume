const express = require('express');
const router = express.Router();
const {
    createSite,
    getAllSites,
    getSite,
    updateSite,
    deleteSite,
    getActiveSites
} = require('../controllers/siteController');
const { protect, requireSuperAdmin } = require('../middleware/adminAuthMiddleware');

// Public routes
router.get('/public/active', getActiveSites);
router.get('/:identifier', getSite);

// Protected routes (Super Admin only)
router.post('/', protect, requireSuperAdmin, createSite);
router.get('/', protect, getAllSites);
router.put('/:id', protect, requireSuperAdmin, updateSite);
router.delete('/:id', protect, requireSuperAdmin, deleteSite);

module.exports = router;
