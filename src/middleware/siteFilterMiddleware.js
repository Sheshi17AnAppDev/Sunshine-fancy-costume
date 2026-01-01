/**
 * Helper middleware to create site filter object for database queries
 * Use this in admin controllers to ensure data isolation per site
 */

const createSiteFilter = (req, res, next) => {
    // Create site filter based on admin's access level
    if (req.isSuperAdmin) {
        // Super admin sees all sites - no filter
        req.siteFilter = {};
    } else if (req.adminSite) {
        // Regular admin - filter by their assigned site
        req.siteFilter = { site: req.adminSite };
    } else {
        // No site context - this shouldn't happen if auth is configured correctly
        return res.status(403).json({
            message: 'Site context required for this operation'
        });
    }

    next();
};

/**
 * Validate that an admin can access a specific site
 * @param {string} siteIdToCheck - The site ID to validate access for
 */
const validateSiteAccess = (siteIdToCheck) => {
    return (req, res, next) => {
        // Super admins can access any site
        if (req.isSuperAdmin) {
            return next();
        }

        // Regular admins can only access their assigned site
        if (req.adminSite && req.adminSite.toString() === siteIdToCheck.toString()) {
            return next();
        }

        return res.status(403).json({
            message: 'Access denied. You can only manage data for your assigned site.'
        });
    };
};

/**
 * Middleware to get admin's current site information
 * Adds req.currentSite object to the request
 */
const getCurrentSite = async (req, res, next) => {
    try {
        if (req.isSuperAdmin) {
            // Super admin has no specific site
            req.currentSite = null;
            return next();
        }

        if (req.user && req.user.site) {
            // Site already populated in auth middleware
            req.currentSite = req.user.site;
            return next();
        }

        // If site not populated, fetch it
        if (req.adminSite) {
            const Site = require('../models/Site');
            const site = await Site.findById(req.adminSite);
            req.currentSite = site;
            return next();
        }

        return res.status(403).json({
            message: 'Site information not available'
        });
    } catch (error) {
        console.error('Error fetching current site:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createSiteFilter,
    validateSiteAccess,
    getCurrentSite
};
