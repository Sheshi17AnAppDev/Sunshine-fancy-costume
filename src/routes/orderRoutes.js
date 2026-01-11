const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    updateOrderItems,
    getMyOrders,
    getOrders,
    deleteOrder
} = require('../controllers/orderController');
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');
const { protectAdminOrUserAdmin, requirePermission } = require('../middleware/adminAuthMiddleware');

router.route('/')
    .post(optionalProtect, addOrderItems)
    .get(protectAdminOrUserAdmin, requirePermission('canManageOrders'), getOrders);

router.route('/myorders').get(protect, getMyOrders);

// Admin order details (must be defined before '/:id')
router.route('/admin/:id')
    .get(protectAdminOrUserAdmin, requirePermission('canManageOrders'), getOrderById)
    .delete(protectAdminOrUserAdmin, requirePermission('canManageOrders'), deleteOrder);

router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, deleteOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protectAdminOrUserAdmin, requirePermission('canManageOrders'), updateOrderToDelivered);
router.route('/:id/items').put(protectAdminOrUserAdmin, requirePermission('canManageOrders'), updateOrderItems);

module.exports = router;
