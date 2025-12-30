const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const adminUser = await AdminUser.findById(decoded.id).select('-password');
            if (adminUser) {
                if (!adminUser.isActive) {
                    return res.status(403).json({ message: 'Access denied. Account is inactive.' });
                }

                req.user = adminUser;
                req.authType = 'admin';

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
            console.error('Admin auth error:', error);
            return res.status(401).json({ message: 'Not authorized, admin token failed' });
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
