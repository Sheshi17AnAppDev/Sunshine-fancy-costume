const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { protect, admin } = require('../middleware/authMiddleware');
// Note: Depending on project, it might be `protect` from 'adminAuthMiddleware' or similar. 
// Checking server.js imports: app.use('/api/admin', require('./src/routes/adminRoutes'));
// adminRoutes uses: const { protect } = require('../middleware/adminAuthMiddleware');
// So we should use that.

const { protect: protectAdmin } = require('../middleware/adminAuthMiddleware');

router.get('/', protectAdmin, mediaController.listMedia);
router.delete('/:filename', protectAdmin, mediaController.deleteMedia);

module.exports = router;
