const express = require('express');
const router = express.Router();
const {
    getBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand
} = require('../controllers/brandController');
const { protectAdminOrUserAdmin, requirePermission } = require('../middleware/adminAuthMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .get(getBrands)
    .post(protectAdminOrUserAdmin, requirePermission('canManageBrands'), upload.single('image'), createBrand);

router.route('/:id')
    .get(getBrand)
    .put(protectAdminOrUserAdmin, requirePermission('canManageBrands'), upload.single('image'), updateBrand)
    .delete(protectAdminOrUserAdmin, requirePermission('canManageBrands'), deleteBrand);

module.exports = router;
