const express = require('express');
const router = express.Router();
const {
    listSiteContentAdmin,
    getSiteContentAdmin,
    updateSiteContentAdmin
} = require('../controllers/siteContentController');
const { protect, requirePermission } = require('../middleware/adminAuthMiddleware');

router.get('/site-content', protect, requirePermission('canManageWebsite'), listSiteContentAdmin);
router.get('/site-content/:key', protect, requirePermission('canManageWebsite'), getSiteContentAdmin);
router.put('/site-content/:key', protect, requirePermission('canManageWebsite'), updateSiteContentAdmin);

module.exports = router;
