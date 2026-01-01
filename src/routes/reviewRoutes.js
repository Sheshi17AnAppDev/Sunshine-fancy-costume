const express = require('express');
const router = express.Router();
const { getProductReviews, createReview, createAdminReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/adminAuthMiddleware'); // Assuming this exists for admin checks

router.get('/:productId', getProductReviews);
router.post('/', createReview);
router.post('/admin', protect, createAdminReview);

module.exports = router;
