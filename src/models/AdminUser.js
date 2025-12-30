const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin'],
        default: 'admin'
    },
    permissions: {
        canManageProducts: { type: Boolean, default: true },
        canManageCategories: { type: Boolean, default: true },
        canManageBrands: { type: Boolean, default: true },
        canManageOrders: { type: Boolean, default: true },
        canManageWebsite: { type: Boolean, default: false },
        canManageAdmins: { type: Boolean, default: false },
        canViewStats: { type: Boolean, default: true },
        canChangeCredentials: { type: Boolean, default: true }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});


// Match password method
adminSchema.methods.matchPassword = async function(enteredPassword) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login
adminSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save({ validateBeforeSave: false });
};

// Check if user has specific permission
adminSchema.methods.hasPermission = function(permission) {
    if (this.role === 'super_admin') return true;
    return this.permissions[permission] || false;
};

module.exports = mongoose.model('AdminUser', adminSchema);
