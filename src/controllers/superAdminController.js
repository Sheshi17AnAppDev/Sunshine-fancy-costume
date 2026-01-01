const AdminUser = require('../models/AdminUser');
const generateToken = require('../config/generateToken');

// @desc    Create or update super admin from environment variables
// @route   POST /api/admin/auth/setup-super-admin
// @access  Public (internal use only)
exports.setupSuperAdminFromEnv = async (req, res) => {
    try {
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
        const superAdminName = process.env.SUPER_ADMIN_NAME || 'Sunshine Super Admin';

        if (!superAdminEmail || !superAdminPassword) {
            return res.status(500).json({
                message: 'Super admin credentials not configured in environment variables'
            });
        }

        // Check if super admin already exists in MongoDB
        let existingSuperAdmin = await AdminUser.findOne({ role: 'super_admin' });

        if (existingSuperAdmin) {
            // Update existing super admin with env credentials
            existingSuperAdmin.name = superAdminName;
            existingSuperAdmin.email = superAdminEmail;
            existingSuperAdmin.password = superAdminPassword; // Will be hashed by pre-save hook
            existingSuperAdmin.permissions = {
                canManageProducts: true,
                canManageCategories: true,
                canManageBrands: true,
                canManageOrders: true,
                canManageWebsite: true,
                canManageAdmins: true,
                canViewStats: true,
                canChangeCredentials: true
            };

            await existingSuperAdmin.save();
            console.log('Super admin updated in MongoDB:', existingSuperAdmin.email);

            return res.json({
                message: 'Super admin updated in database',
                admin: {
                    _id: existingSuperAdmin._id,
                    name: existingSuperAdmin.name,
                    email: existingSuperAdmin.email,
                    role: existingSuperAdmin.role
                }
            });
        } else {
            // Create new super admin
            const superAdmin = await AdminUser.create({
                name: superAdminName,
                email: superAdminEmail,
                password: superAdminPassword, // Will be hashed by pre-save hook
                role: 'super_admin',
                permissions: {
                    canManageProducts: true,
                    canManageCategories: true,
                    canManageBrands: true,
                    canManageOrders: true,
                    canManageWebsite: true,
                    canManageAdmins: true,
                    canViewStats: true,
                    canChangeCredentials: true
                }
            });

            console.log('Super admin created in MongoDB:', superAdmin.email);

            return res.status(201).json({
                message: 'Super admin created in database',
                admin: {
                    _id: superAdmin._id,
                    name: superAdmin.name,
                    email: superAdmin.email,
                    role: superAdmin.role
                }
            });
        }
    } catch (error) {
        console.error('Super admin setup error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new admin user (super admin only)
// @route   POST /api/admin/admins/create
// @access  Private (Super Admin only)
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, permissions } = req.body;

        // Check if admin already exists
        const existingAdmin = await AdminUser.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Create new admin
        const newAdmin = await AdminUser.create({
            name,
            email,
            password,
            role: 'admin',
            permissions: permissions || {},
            createdBy: req.user._id
        });

        res.status(201).json({
            message: 'Admin created successfully',
            admin: {
                _id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role,
                permissions: newAdmin.permissions,
                isActive: newAdmin.isActive,
                createdAt: newAdmin.createdAt
            }
        });
    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all admin users (super admin only)
// @route   GET /api/admin/admins
// @access  Private (Super Admin only)
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await AdminUser.find()
            .select('-password')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update admin permissions (super admin only)
// @route   PUT /api/admin/admins/:id/permissions
// @access  Private (Super Admin only)
exports.updateAdminPermissions = async (req, res) => {
    try {
        const { permissions } = req.body;
        const adminId = req.params.id;

        // Don't allow changing super admin permissions
        const admin = await AdminUser.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot modify super admin permissions' });
        }

        admin.permissions = { ...admin.permissions, ...permissions };
        await admin.save();

        res.json({
            message: 'Admin permissions updated successfully',
            permissions: admin.permissions
        });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle admin active status (super admin only)
// @route   PUT /api/admin/admins/:id/toggle
// @access  Private (Super Admin only)
exports.toggleAdminStatus = async (req, res) => {
    try {
        const adminId = req.params.id;

        const admin = await AdminUser.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot deactivate super admin' });
        }

        admin.isActive = !admin.isActive;
        await admin.save();

        res.json({
            message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: admin.isActive
        });
    } catch (error) {
        console.error('Toggle admin status error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete admin user (super admin only)
// @route   DELETE /api/admin/admins/:id
// @access  Private (Super Admin only)
exports.deleteAdmin = async (req, res) => {
    try {
        const adminId = req.params.id;

        const admin = await AdminUser.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot delete super admin' });
        }

        await AdminUser.findByIdAndDelete(adminId);

        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ message: error.message });
    }
};
