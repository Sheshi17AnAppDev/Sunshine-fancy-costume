const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getRecentOrders,
    getSalesChartData,
    getTopProducts,
    getUserReport,
    getUserOrders,
    deleteUserAndData
} = require('../controllers/adminStatsController');
const { protect, requirePermission } = require('../middleware/adminAuthMiddleware');

// Admin dashboard routes
router.get('/stats', protect, requirePermission('canViewStats'), getDashboardStats);
router.get('/stats/sales-chart', protect, requirePermission('canViewStats'), getSalesChartData);
router.get('/stats/top-products', protect, requirePermission('canViewStats'), getTopProducts);
router.get('/orders/recent', protect, requirePermission('canViewStats'), getRecentOrders);
router.get('/users/report', protect, requirePermission('canViewStats'), getUserReport);
router.get('/users/:id/orders', protect, requirePermission('canViewStats'), getUserOrders);
router.delete('/users/:id', protect, requirePermission('canViewStats'), deleteUserAndData);

module.exports = router;
