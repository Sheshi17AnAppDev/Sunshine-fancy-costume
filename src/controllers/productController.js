const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const filter = {};

        // Site Filtering logic (Admin)
        if (req.user && req.authType === 'admin') {
            if (req.adminSite) filter.site = req.adminSite;
        }

        // Public Query Filtering
        if (req.query.category) filter.category = req.query.category;
        if (req.query.isFeatured) filter.isFeatured = req.query.isFeatured === 'true';
        if (req.query.isPopular) filter.isPopular = req.query.isPopular === 'true';

        // Support limiting fields for lighter payload if needed? (Not implemented yet to avoid breaking frontend that expects full objects)

        const products = await Product.find(filter).populate('category', 'name').sort({ createdAt: -1 });
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
        const { name, description, price, originalPrice, category, brand, countInStock, isFeatured, isPopular, images, video, agePrices, sizePrices } = req.body;

        const product = new Product({
            name,
            description,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : 0,
            category,
            brand: brand || null,
            countInStock: Number(countInStock),
            isFeatured,
            isPopular,
            images: images || [],
            video: video || null,
            agePrices: agePrices || [],
            sizePrices: sizePrices || []
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
        const { name, description, price, originalPrice, category, brand, countInStock, isFeatured, isPopular, images, video, agePrices, sizePrices } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            // Track deleted images/videos for Cloudinary cleanup
            const deletedMediaPublicIds = [];

            // Handle image deletions
            if (images !== undefined) {
                const oldImages = product.images || [];
                const newImages = images || [];

                // Find deleted images by comparing URLs/public_ids
                oldImages.forEach(oldImg => {
                    const oldUrl = oldImg.url || oldImg;
                    const oldPublicId = oldImg.public_id;

                    const stillExists = newImages.some(newImg => {
                        const newUrl = newImg.url || newImg;
                        return newUrl === oldUrl;
                    });

                    if (!stillExists && oldPublicId) {
                        deletedMediaPublicIds.push(oldPublicId);
                    }
                });

                product.images = images;
            }

            // Handle video deletion
            if (video !== undefined) {
                const oldVideo = product.video;
                const newVideo = video;

                // If video was removed (had video, now null/undefined)
                if (oldVideo && oldVideo.public_id && !newVideo) {
                    deletedMediaPublicIds.push(oldVideo.public_id);
                }

                product.video = video;
            }

            // Delete from Cloudinary
            if (deletedMediaPublicIds.length > 0) {
                console.log('Deleting from Cloudinary:', deletedMediaPublicIds);
                for (const publicId of deletedMediaPublicIds) {
                    try {
                        // Determine resource type (image or video)
                        const resourceType = publicId.includes('video') ? 'video' : 'image';
                        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                        console.log(`Deleted ${resourceType} ${publicId} from Cloudinary`);
                    } catch (cloudinaryError) {
                        console.error(`Failed to delete ${publicId} from Cloudinary:`, cloudinaryError);
                        // Continue even if Cloudinary deletion fails
                    }
                }
            }

            // Update other fields
            if (name !== undefined) product.name = name;
            if (description !== undefined) product.description = description;
            if (price !== undefined) product.price = Number(price);
            if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
            if (category !== undefined) product.category = category;
            if (brand !== undefined) product.brand = brand || null;
            if (countInStock !== undefined) product.countInStock = Number(countInStock);
            if (isFeatured !== undefined) product.isFeatured = isFeatured;
            if (isPopular !== undefined) product.isPopular = isPopular;

            if (agePrices !== undefined) {
                product.agePrices = agePrices;
                product.markModified('agePrices');
            }

            if (sizePrices !== undefined) {
                product.sizePrices = sizePrices;
                product.markModified('sizePrices');
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
