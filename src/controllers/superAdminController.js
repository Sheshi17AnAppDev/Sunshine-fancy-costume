// Use mock model for testing when MongoDB is not available
const AdminUser = require('../models/AdminUser');
const MockAdminUser = require('../models/MockAdminUser');
const generateToken = require('../config/generateToken');

// @desc    Create or update super admin from environment variables
// @route   POST /api/admin/auth/setup-super-admin
// @access  Public (internal use only)
exports.setupSuperAdminFromEnv = async (req, res) => {
    try {
        // Ignore any init key or request body - just use environment variables
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
        const superAdminName = process.env.SUPER_ADMIN_NAME || 'Sunshine Super Admin';

        if (!superAdminEmail || !superAdminPassword) {
            return res.status(500).json({ 
                message: 'Super admin credentials not configured in environment variables',
                missing: {
                    email: !superAdminEmail ? 'SUPER_ADMIN_EMAIL' : null,
                    password: !superAdminPassword ? 'SUPER_ADMIN_PASSWORD' : null
                }
            });
        }

        // Always try MongoDB first for proper database storage
        try {
            // Check if super admin already exists in MongoDB
            let existingSuperAdmin = await AdminUser.findOne({ role: 'super_admin' });
            
            if (existingSuperAdmin) {
                // Update existing super admin with env credentials
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
                
                existingSuperAdmin.name = superAdminName;
                existingSuperAdmin.email = superAdminEmail;
                existingSuperAdmin.password = hashedPassword; // Use hashed password
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
                        role: existingSuperAdmin.role,
                        permissions: existingSuperAdmin.permissions
                    }
                });
            } else {
                // Hash password before creating super admin
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
                
                // Create new super admin in MongoDB
                const superAdmin = await AdminUser.create({
                    name: superAdminName,
                    email: superAdminEmail,
                    password: hashedPassword,
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
                        role: superAdmin.role,
                        permissions: superAdmin.permissions
                    }
                });
            }
        } catch (dbError) {
            console.error('MongoDB error, falling back to mock:', dbError);
            // Fall back to mock only if MongoDB completely fails
            try {
                let existingSuperAdmin = await MockAdminUser.findOne({ role: 'super_admin' });
                
                if (existingSuperAdmin) {
                    existingSuperAdmin.name = superAdminName;
                    existingSuperAdmin.email = superAdminEmail;
                    existingSuperAdmin.password = superAdminPassword;
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
                    console.log('Super admin updated in mock (MongoDB unavailable):', existingSuperAdmin.email);
                    
                    return res.json({
                        message: 'Super admin created in temporary storage (MongoDB unavailable)',
                        admin: {
                            _id: existingSuperAdmin._id,
                            name: existingSuperAdmin.name,
                            email: existingSuperAdmin.email,
                            role: existingSuperAdmin.role,
                            permissions: existingSuperAdmin.permissions
                        }
                    });
                } else {
                    const superAdmin = await MockAdminUser.create({
                        name: superAdminName,
                        email: superAdminEmail,
                        password: superAdminPassword,
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

                    console.log('Super admin created in mock (MongoDB unavailable):', superAdmin.email);

                    return res.status(201).json({
                        message: 'Super admin created in temporary storage (MongoDB unavailable)',
                        admin: {
                            _id: superAdmin._id,
                            name: superAdmin.name,
                            email: superAdmin.email,
                            role: superAdmin.role,
                            permissions: superAdmin.permissions
                        }
                    });
                }
            } catch (mockError) {
                console.error('Mock database error:', mockError);
                return res.status(500).json({ 
                    message: 'Failed to setup super admin - database connection failed',
                    error: mockError.message 
                });
            }
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
            return res.status(403). json({ message: 'Cannot delete super admin' });
        }

        await AdminUser.findByIdAndDelete(adminId);

        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ message: error.message });
    }
};
