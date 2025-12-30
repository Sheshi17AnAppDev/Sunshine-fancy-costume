const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protectAdminOrUserAdmin, requirePermission } = require('../middleware/adminAuthMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .get(getCategories)
    .post(protectAdminOrUserAdmin, requirePermission('canManageCategories'), upload.single('image'), createCategory);
router
    .route('/:id')
    .put(protectAdminOrUserAdmin, requirePermission('canManageCategories'), upload.single('image'), updateCategory)
    .delete(protectAdminOrUserAdmin, requirePermission('canManageCategories'), deleteCategory);

module.exports = router;
