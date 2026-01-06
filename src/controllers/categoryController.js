const Site = require('../models/Site');
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const filter = {};

        // Apply site filtering for admin access
        if (req.user && req.authType === 'admin' && req.adminSite) {
            filter.site = req.adminSite;
        }

        const categories = await Category.find(filter);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    const { name, description, image } = req.body;

    try {
        let siteId = req.adminSite || req.body.site;

        // Fallback for Super Admin if no site is selected/provided
        if (!siteId) {
            const defaultSite = await Site.findOne({ isActive: true });
            if (defaultSite) {
                siteId = defaultSite._id;
            } else {
                return res.status(400).json({ message: 'No active site found to associate with this category.' });
            }
        }

        const category = new Category({
            name,
            description,
            image: req.file ? req.file.path : image,
            site: siteId
        });

        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        console.error('Create category error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }
        res.status(400).json({ message: error.message || 'Error creating category' });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    const { name, description, image } = req.body;

    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = name || category.name;
            category.description = description || category.description;
            category.image = req.file ? req.file.path : (image || category.image);

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
