const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            product: req.params.productId,
            status: 'approved'
        }).sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Public
exports.createReview = async (req, res) => {
    try {
        const { productId, user, rating, comment, siteId } = req.body;

        // Auto-approve if it matches admin pattern/secret or logic (simplified here)
        // Ideally, we check req.user if using auth middleware
        // For now, let's assume public reviews are pending, unless explicitly admin

        let status = 'approved'; // Defaulting to approved for now as per "like user also" request implies instant gratification, but usually pending. 
        // Let's set to approved for simplicity unless user wants moderation.

        const review = await Review.create({
            product: productId,
            user,
            rating,
            comment,
            site: siteId,
            status: 'approved' // Setting to approved directly so they appear
        });

        // Update Product Rating
        // We can do this async or on-the-fly. Let's do a simple average update.
        // const stats = await Review.aggregate([
        //    { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
        //    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } }
        // ]);
        // if (stats.length > 0) {
        //     await Product.findByIdAndUpdate(productId, {
        //         rating: stats[0].avgRating,
        //         numReviews: stats[0].numReviews
        //     });
        // }

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Admin Review
// @route   POST /api/reviews/admin
// @access  Private/Admin
exports.createAdminReview = async (req, res) => {
    try {
        const { productId, user, rating, comment } = req.body;

        const review = await Review.create({
            product: productId,
            user: user || 'Store Admin',
            isAdmin: true,
            rating,
            comment,
            site: req.adminSite || req.body.siteId, // From auth middleware or body
            status: 'approved'
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
