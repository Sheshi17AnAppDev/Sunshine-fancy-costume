const Site = require('../models/Site');

/**
 * Middleware to detect and validate the current site from the URL
 * Supports path-based routing: /site/:slug/*
 */
exports.detectSite = async (req, res, next) => {
    try {
        let siteSlug = null;

        // Extract site slug from URL path
        // Format: /site/:slug/... or /api/site/:slug/...
        const pathMatch = req.path.match(/^\/?(?:api\/)?site\/([a-z0-9-]+)/i);
        if (pathMatch) {
            siteSlug = pathMatch[1].toLowerCase();
        }

        // If no site in path, check query parameter as fallback
        if (!siteSlug && req.query.site) {
            siteSlug = req.query.site.toLowerCase();
        }

        // If still no site, use default (sunshine)
        if (!siteSlug) {
            siteSlug = 'sunshine';
        }

        // Find the site in database
        const site = await Site.findOne({ slug: siteSlug });

        if (!site) {
            return res.status(404).json({
                message: `Site '${siteSlug}' not found`,
                availableSites: await Site.find({ isActive: true }).select('slug name')
            });
        }

        if (!site.isActive) {
            return res.status(403).json({ message: 'This site is currently inactive' });
        }

        // Attach site to request object
        req.site = site;
        req.siteId = site._id;

        next();
    } catch (error) {
        console.error('Site detection error:', error);
        res.status(500).json({ message: 'Site detection failed' });
    }
};

/**
 * Middleware to require site context (throw error if no site detected)
 */
exports.requireSite = (req, res, next) => {
    if (!req.site) {
        return res.status(400).json({ message: 'Site context is required' });
    }
    next();
};

/**
 * Middleware to add site filter to query automatically
 */
exports.addSiteFilter = (req, res, next) => {
    if (req.site) {
        // Add site filter to req object for controllers to use
        req.siteFilter = { site: req.siteId };
    }
    next();
};
