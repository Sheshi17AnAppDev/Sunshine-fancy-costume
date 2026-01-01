const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (token === 'null' || token === 'undefined') {
                return res.status(401).json({ message: 'Not authorized, invalid token format' });
            }

            // Sanitize token: remove double quotes if present (common client-side storage issue)
            token = token.replace(/"/g, '');

            // Log token for debugging (first 10 chars)
            // console.log('Verifying admin token:', token.substring(0, 10) + '...');

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_fallback_12345');

            const adminUser = await AdminUser.findById(decoded.id).select('-password').populate('site');
            if (adminUser) {
                if (!adminUser.isActive) {
                    return res.status(403).json({ message: 'Access denied. Account is inactive.' });
                }

                req.user = adminUser;
                req.authType = 'admin';

                // Inject site context for data filtering
                if (adminUser.role === 'super_admin') {
                    req.adminSite = null; // Super admin can access all sites
                    req.isSuperAdmin = true;
                } else {
                    req.adminSite = adminUser.site?._id || adminUser.site; // Site-specific admin
                    req.isSuperAdmin = false;
                }

                // Update last login (admin users only)
                await adminUser.updateLastLogin();

                return next();
            }

            // Fallback: allow legacy User model admins (for backward compatibility)
            const legacyUser = await User.findById(decoded.id).select('-password');
            if (legacyUser && legacyUser.role === 'admin') {
                req.user = legacyUser;
                req.authType = 'legacy_user_admin';
                return next();
            }

            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        } catch (error) {
            console.error('Admin auth error:', error.message); // Log message only to avoid stack trace spam
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no admin token' });
    }
};

// Permission-based middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Legacy user admins have no granular permissions, treat as allowed.
        if (typeof req.user.hasPermission === 'function') {
            if (!req.user.hasPermission(permission)) {
                return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            }
        }

        next();
    };
};

// Super admin only middleware
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
    }

    next();
};

// Alias for readability where legacy admins should also be accepted
const protectAdminOrUserAdmin = protect;

module.exports = { protect, protectAdminOrUserAdmin, requirePermission, requireSuperAdmin };
