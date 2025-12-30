const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getSalesChartData = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    isPaid: true
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(dailySales);
    } catch (error) {
        console.error('Sales chart error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get top selling products
// @route   GET /api/admin/stats/top-products
// @access  Private (Admin only)
exports.getTopProducts = async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: "$orderItems.product",
                    name: { $first: "$orderItems.name" },
                    sales: { $sum: "$orderItems.qty" },
                    revenue: { $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] } }
                }
            },
            { $sort: { sales: -1 } },
            { $limit: 5 }
        ]);

        res.json(topProducts);
    } catch (error) {
        console.error('Top products error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });

        // Calculate total revenue and funnel stats
        const allProducts = await Product.find({});
        const totalViews = allProducts.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalBooked = allProducts.reduce((sum, p) => sum + (p.bookedCount || 0), 0);

        const orders = await Order.find({ isPaid: true });
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        // Get recent orders
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('totalPrice isPaid isDelivered createdAt user');

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            totalViews,
            totalBooked,
            recentOrders: recentOrders.map(order => ({
                _id: order._id,
                orderNumber: order._id.toString().slice(-6).toUpperCase(),
                customer: order.user?.name || 'Guest',
                email: order.user?.email || 'unknown@example.com',
                total: order.totalPrice || 0,
                status: order.isDelivered ? 'delivered' : (order.isPaid ? 'paid' : 'pending'),
                date: order.createdAt
            }))
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get recent orders for admin
// @route   GET /api/admin/orders/recent
// @access  Private (Admin only)
exports.getRecentOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(20)
            .select('totalPrice isPaid isDelivered createdAt user');

        res.json(orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString().slice(-6).toUpperCase(),
            customer: order.user?.name || 'Guest',
            email: order.user?.email || 'unknown@example.com',
            total: order.totalPrice || 0,
            status: order.isDelivered ? 'delivered' : (order.isPaid ? 'paid' : 'pending'),
            date: order.createdAt
        })));
    } catch (error) {
        console.error('Recent orders error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user report for admin
// @route   GET /api/admin/users/report
// @access  Private (Admin only)
exports.getUserReport = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('name email createdAt');

        const report = await Promise.all(users.map(async (user) => {
            const orders = await Order.find({ user: user._id });
            const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                orderCount: orders.length,
                totalSpent: totalSpent
            };
        }));

        res.json(report);
    } catch (error) {
        console.error('User report error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders for a specific user
// @route   GET /api/admin/users/:id/orders
// @access  Private (Admin only)
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
