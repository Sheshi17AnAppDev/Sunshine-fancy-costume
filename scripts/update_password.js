require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../src/models/AdminUser');
const connectDB = require('../src/config/db');

const updatePassword = async () => {
    try {
        await connectDB();

        const targetEmail = 'fancycostumesunshine@gmail.com';
        const targetPassword = 'CSf@1234';

        console.log(`Finding Admin with email: ${targetEmail}...`);

        // Find existing user by email (or any super admin if strict match fails? No, specific email requested)
        let admin = await AdminUser.findOne({ email: targetEmail });

        if (!admin) {
            // Check if there is ANY super admin, maybe updating their email?
            // But usually safer to create the specific one requested.
            // Let's just create if not found.
            console.log(`Admin ${targetEmail} not found. Creating new Super Admin...`);
            await AdminUser.create({
                name: 'Super Admin',
                email: targetEmail,
                password: targetPassword,
                role: 'super_admin',
                isActive: true,
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
            console.log(`Created new Super Admin (${targetEmail}) with password ${targetPassword}`);
        } else {
            console.log(`Found Admin: ${admin.email}`);
            admin.password = targetPassword;
            if (admin.role !== 'super_admin') {
                console.log('Promoting to super_admin...');
                admin.role = 'super_admin';
            }
            await admin.save();
            console.log(`Successfully updated password for ${admin.email} to ${targetPassword}`);
        }

        process.exit();
    } catch (err) {
        console.error('Error updating password:', err);
        process.exit(1);
    }
};

updatePassword();
