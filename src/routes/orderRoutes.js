const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const { protectAdminOrUserAdmin, requirePermission } = require('../middleware/adminAuthMiddleware');

router.route('/')
    .post(protect, addOrderItems)
    .get(protectAdminOrUserAdmin, requirePermission('canManageOrders'), getOrders);

router.route('/myorders').get(protect, getMyOrders);

// Admin order details (must be defined before '/:id')
router.route('/admin/:id')
    .get(protectAdminOrUserAdmin, requirePermission('canManageOrders'), getOrderById);

router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protectAdminOrUserAdmin, requirePermission('canManageOrders'), updateOrderToDelivered);

module.exports = router;
