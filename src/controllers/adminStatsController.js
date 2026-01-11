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

        // Modified: removed isPaid: true constraint to show all orders (including COD)
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
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
        let topProducts = await Order.aggregate([
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

        // Fallback: If no orders/top products, show popular products
        if (!topProducts || topProducts.length === 0) {
            const popularProducts = await Product.find({ isPopular: true })
                .limit(5)
                .select('name price views bookedCount');

            topProducts = popularProducts.map(p => ({
                _id: p._id,
                name: p.name,
                sales: p.bookedCount || 0, // Use different metric or 0
                revenue: 0 // Placeholder
            }));
        }

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
        const lowStockCount = await Product.countDocuments({ countInStock: { $lte: 2 } });

        const orders = await Order.find({ isPaid: true });
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        // Calculate Today's Revenue
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todaysOrders = await Order.find({
            isPaid: true,
            createdAt: { $gte: todayStart }
        });
        const todaysRevenue = todaysOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        // Get recent orders
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('totalPrice isPaid isDelivered createdAt user orderItems');

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            todaysRevenue,
            totalViews,
            totalBooked,
            lowStockCount,
            recentOrders: recentOrders.map(order => ({
                _id: order._id,
                orderNumber: order._id.toString().slice(-6).toUpperCase(),
                customer: order.user?.name || 'Guest',
                customerId: order.user?._id, // Added for profile link
                email: order.user?.email || 'unknown@example.com',
                total: order.totalPrice || 0,
                status: order.isDelivered ? 'delivered' : (order.isPaid ? 'paid' : 'pending'),
                date: order.createdAt,
                // Add product info
                productImage: order.orderItems && order.orderItems.length > 0 ? order.orderItems[0].image : null,
                productName: order.orderItems && order.orderItems.length > 0 ? order.orderItems[0].name : 'Unknown Product',
                itemsCount: order.orderItems ? order.orderItems.length : 0
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
            .select('totalPrice isPaid isDelivered createdAt user orderItems');

        res.json(orders.map(order => ({
            _id: order._id,
            orderNumber: order._id.toString().slice(-6).toUpperCase(),
            customer: order.user?.name || 'Guest',
            customerId: order.user?._id, // Added for profile link
            email: order.user?.email || 'unknown@example.com',
            total: order.totalPrice || 0,
            status: order.isDelivered ? 'delivered' : (order.isPaid ? 'paid' : 'pending'),
            date: order.createdAt,
            // Add product info
            productImage: order.orderItems && order.orderItems.length > 0 ? order.orderItems[0].image : null,
            productName: order.orderItems && order.orderItems.length > 0 ? order.orderItems[0].name : 'Unknown Product',
            itemsCount: order.orderItems ? order.orderItems.length : 0
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
// @desc    Delete user and all their associated data (Orders)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUserAndData = async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Check if user exists and is a regular user (not admin)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin users from here' });
        }

        // 2. Delete all orders associated with this user
        await Order.deleteMany({ user: userId });

        // 3. Delete the user
        await User.findByIdAndDelete(userId);

        res.json({ message: 'User and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: error.message });
    }
};
