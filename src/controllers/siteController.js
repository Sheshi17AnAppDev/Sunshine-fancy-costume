const Site = require('../models/Site');

// @desc    Create new site
// @route   POST /api/sites
// @access  Private (Super Admin only)
exports.createSite = async (req, res) => {
    try {
        const { name, slug, description, logo, theme, settings, contact, seo } = req.body;

        // Check if slug already exists
        const existingSite = await Site.findOne({ slug });
        if (existingSite) {
            return res.status(400).json({ message: 'Site with this slug already exists' });
        }

        const site = await Site.create({
            name,
            slug,
            description,
            logo,
            theme,
            settings,
            contact,
            seo,
            createdBy: req.user._id
        });

        // Initialize default site content for new site
        const SiteContent = require('../models/SiteContent');
        const defaultContent = [
            { key: 'header', data: { logoText: name, navLinks: [], rotatingWords: [] } },
            { key: 'home', data: { hero: {}, sectionTitles: {} } },
            { key: 'about', data: {} },
            { key: 'theme', data: theme || {} },
            { key: 'offerBanner', data: { isVisible: false } },
            { key: 'promoCarousel', data: { isVisible: false, slides: [] } }
        ];

        for (const content of defaultContent) {
            await SiteContent.create({
                site: site._id,
                ...content
            });
        }

        res.status(201).json(site);
    } catch (error) {
        console.error('Create site error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all sites
// @route   GET /api/sites
// @access  Private (Admin)
exports.getAllSites = async (req, res) => {
    try {
        const sites = await Site.find().sort({ createdAt: -1 });
        res.json(sites);
    } catch (error) {
        console.error('Get sites error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get site by slug or ID
// @route   GET /api/sites/:identifier
// @access  Public
exports.getSite = async (req, res) => {
    try {
        const { identifier } = req.params;

        // Try to find by ID first, then by slug
        let site = await Site.findById(identifier);
        if (!site) {
            site = await Site.findOne({ slug: identifier });
        }

        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        res.json(site);
    } catch (error) {
        console.error('Get site error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private (Super Admin only)
exports.updateSite = async (req, res) => {
    try {
        const { name, slug, description, logo, favicon, isActive, theme, settings, contact, seo } = req.body;

        const site = await Site.findById(req.params.id);
        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        // Check if new slug conflicts with another site
        if (slug && slug !== site.slug) {
            const existingSite = await Site.findOne({ slug });
            if (existingSite) {
                return res.status(400).json({ message: 'Site with this slug already exists' });
            }
        }

        site.name = name || site.name;
        site.slug = slug || site.slug;
        site.description = description !== undefined ? description : site.description;
        site.logo = logo !== undefined ? logo : site.logo;
        site.favicon = favicon !== undefined ? favicon : site.favicon;
        site.isActive = isActive !== undefined ? isActive : site.isActive;
        if (theme) site.theme = { ...site.theme, ...theme };
        if (settings) site.settings = { ...site.settings, ...settings };
        if (contact) site.contact = { ...site.contact, ...contact };
        if (seo) site.seo = { ...site.seo, ...seo };

        const updatedSite = await site.save();
        res.json(updatedSite);
    } catch (error) {
        console.error('Update site error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete site (cascade delete all related data)
// @route   DELETE /api/sites/:id
// @access  Private (Super Admin only)
exports.deleteSite = async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);
        if (!site) {
            return res.status(404).json({ message: 'Site not found' });
        }

        // Prevent deleting the last site
        const siteCount = await Site.countDocuments();
        if (siteCount <= 1) {
            return res.status(400).json({ message: 'Cannot delete the last site' });
        }

        // Delete all related data (cascade)
        const Product = require('../models/Product');
        const Category = require('../models/Category');
        const Brand = require('../models/Brand');
        const Order = require('../models/Order');
        const User = require('../models/User');
        const SiteContent = require('../models/SiteContent');

        await Promise.all([
            Product.deleteMany({ site: site._id }),
            Category.deleteMany({ site: site._id }),
            Brand.deleteMany({ site: site._id }),
            Order.deleteMany({ site: site._id }),
            User.deleteMany({ site: site._id }),
            SiteContent.deleteMany({ site: site._id })
        ]);

        await site.deleteOne();

        res.json({ message: 'Site and all related data deleted successfully' });
    } catch (error) {
        console.error('Delete site error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active sites (for public listing)
// @route   GET /api/sites/public/active
// @access  Public
exports.getActiveSites = async (req, res) => {
    try {
        const sites = await Site.find({ isActive: true })
            .select('name slug description logo theme')
            .sort({ name: 1 });
        res.json(sites);
    } catch (error) {
        console.error('Get active sites error:', error);
        res.status(500).json({ message: error.message });
    }
};
