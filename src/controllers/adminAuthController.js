const AdminUser = require('../models/AdminUser');
const generateToken = require('../config/generateToken');

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);
    console.log('Password provided:', password ? 'Yes' : 'No');

    try {
        const admin = await AdminUser.findOne({ email }).select('+password');

        if (admin) {
            console.log('Admin found, checking password...');
            const passwordMatch = await admin.matchPassword(password);
            console.log('Password match result:', passwordMatch);

            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }

            if (!admin.isActive) {
                return res.status(403).json({ message: 'Access denied. Account is inactive.' });
            }
        } else {
            console.log('Admin not found with email:', email);
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // Update last login
        await admin.updateLastLogin();

        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            token: generateToken(admin._id)
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/auth/profile
// @access  Private (Admin only)
exports.getAdminProfile = async (req, res) => {
    try {
        const admin = await AdminUser.findById(req.user._id).select('-password');

        if (admin) {
            res.json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin,
                createdAt: admin.createdAt
            });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update admin credentials
// @route   PUT /api/admin/auth/credentials
// @access  Private (Admin only)
exports.updateCredentials = async (req, res) => {
    try {
        const { currentPassword, newPassword, name } = req.body;
        const admin = await AdminUser.findById(req.user._id).select('+password');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if user has permission to change credentials
        if (!admin.hasPermission('canChangeCredentials')) {
            return res.status(403).json({ message: 'Access denied. Cannot change credentials.' });
        }

        // Verify current password
        if (!(await admin.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update fields
        if (newPassword) {
            admin.password = newPassword;
        }
        if (name) {
            admin.name = name;
        }

        await admin.save();

        res.json({
            message: 'Credentials updated successfully',
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Update credentials error:', error);
        res.status(500).json({ message: error.message });
    }
};
