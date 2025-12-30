const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    incrementView,
    incrementBooked
} = require('../controllers/productController');
const { protectAdminOrUserAdmin, requirePermission } = require('../middleware/adminAuthMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .get(getProducts)
    .post(protectAdminOrUserAdmin, requirePermission('canManageProducts'), createProduct);

router.route('/:id')
    .get(getProductById)
    .put(protectAdminOrUserAdmin, requirePermission('canManageProducts'), updateProduct)
    .delete(protectAdminOrUserAdmin, requirePermission('canManageProducts'), deleteProduct);

router.patch('/:id/view', incrementView);
router.patch('/:id/booked', incrementBooked);

module.exports = router;
