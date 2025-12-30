const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('category', 'name');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category, brand, countInStock, isFeatured, isPopular, images, agePrices } = req.body;

        const product = new Product({
            name,
            description,
            price: Number(price),
            category,
            brand: brand || null,
            countInStock: Number(countInStock),
            isFeatured,
            isPopular,
            images: images || [],
            agePrices: agePrices || []
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, category, brand, countInStock, isFeatured, isPopular, images, agePrices } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            if (name !== undefined) product.name = name;
            if (description !== undefined) product.description = description;
            if (price !== undefined) product.price = Number(price);
            if (category !== undefined) product.category = category;
            if (brand !== undefined) product.brand = brand || null;
            if (countInStock !== undefined) product.countInStock = Number(countInStock);
            if (isFeatured !== undefined) product.isFeatured = isFeatured;
            if (isPopular !== undefined) product.isPopular = isPopular;

            if (agePrices !== undefined) {
                product.agePrices = agePrices;
                product.markModified('agePrices');
            }

            if (images !== undefined) {
                product.images = images;
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            // Delete images from Cloudinary
            if (product.images && product.images.length > 0) {
                for (const img of product.images) {
                    if (img.public_id) {
                        try {
                            await cloudinary.uploader.destroy(img.public_id);
                        } catch (err) {
                            console.error(`Failed to delete image ${img.public_id} from Cloudinary:`, err);
                        }
                    }
                }
            }
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Increment product views
// @route   PATCH /api/products/:id/view
// @access  Public
exports.incrementView = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Increment product booked count
// @route   PATCH /api/products/:id/booked
// @access  Public
exports.incrementBooked = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { $inc: { bookedCount: 1 } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
