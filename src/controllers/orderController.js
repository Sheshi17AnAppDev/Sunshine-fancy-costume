const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            res.status(400).json({ message: 'No order items' });
            return;
        }

        // Use site from middleware or default
        let siteId = req.site ? req.site._id : undefined;
        if (!siteId) {
            // Fallback: find default site
            const Site = require('../models/Site');
            const defaultSite = await Site.findOne({ isActive: true });
            if (defaultSite) siteId = defaultSite._id;
        }

        if (!siteId) {
            return res.status(400).json({ message: 'Site context required' });
        }

        const order = new Order({
            orderItems,
            user: req.user ? req.user._id : undefined,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            site: siteId
        });

        const createdOrder = await order.save();

        // Reduce stock for each product
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { countInStock: -item.qty }
            });
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Order Create Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate(
            'user',
            'name email'
        );

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update order items
// @route   PUT /api/orders/:id/items
// @access  Private/Admin
exports.updateOrderItems = async (req, res) => {
    try {
        const { orderItems } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            // Update stock levels based on difference
            for (const newItem of orderItems) {
                const oldItem = order.orderItems.find(i => i.product.toString() === newItem.product.toString());

                if (oldItem) {
                    const diff = oldItem.qty - newItem.qty;
                    if (diff !== 0) {
                        // If diff > 0 (reduced order qty), increment stock
                        // If diff < 0 (increased order qty), decrement stock
                        await Product.findByIdAndUpdate(newItem.product, {
                            $inc: { countInStock: diff }
                        });
                    }
                } else {
                    // New item added to order - decrease stock
                    await Product.findByIdAndUpdate(newItem.product, {
                        $inc: { countInStock: -newItem.qty }
                    });
                }
            }

            // Check for removed items
            for (const oldItem of order.orderItems) {
                const stillExists = orderItems.find(i => i.product.toString() === oldItem.product.toString());
                if (!stillExists) {
                    // Item was removed from order - return stock
                    await Product.findByIdAndUpdate(oldItem.product, {
                        $inc: { countInStock: oldItem.qty }
                    });
                }
            }

            order.orderItems = orderItems;

            // Recalculate prices
            const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
            order.itemsPrice = itemsPrice;
            order.totalPrice = itemsPrice + (order.shippingPrice || 0);

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            // Check ownership or admin

            const isOwner = order.user && req.user && req.user._id && order.user.toString() === req.user._id.toString();
            const isAdmin = req.user && (req.user.isAdmin || req.user.role === 'admin' || req.user.role === 'super_admin');

            if (!isOwner && !isAdmin) {
                res.status(401);
                throw new Error('Not authorized to delete this order');
            }

            // Optional: Prevent deleting paid/delivered orders if that's a business rule
            // For now, allowing deletion as per user request (or maybe just "remove from view"?)
            // Usually "delete" means delete.

            await order.deleteOne();
            res.json({ message: 'Order removed' });
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
