const mongoose = require('mongoose');
require('dotenv').config();
const Site = require('../src/models/Site');
const AdminUser = require('../src/models/AdminUser');

async function migrateAdminSites() {
    try {
        console.log('🔄 Starting admin site assignment migration...');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Find default site
        const defaultSite = await Site.findOne({ slug: 'sunshine' });

        if (!defaultSite) {
            console.error('❌ Default site "sunshine" not found. Please run multi-site migration first.');
            process.exit(1);
        }

        console.log(`✅ Found default site: ${defaultSite.name} (${defaultSite._id})`);

        // Update all existing non-super-admin users to have the default site
        const regularAdminsResult = await AdminUser.updateMany(
            {
                role: { $ne: 'super_admin' },
                site: { $exists: false }
            },
            {
                $set: { site: defaultSite._id }
            }
        );

        console.log(`✅ Assigned ${regularAdminsResult.modifiedCount} regular admin(s) to default site`);

        // Ensure super admins have site: null
        const superAdminsResult = await AdminUser.updateMany(
            { role: 'super_admin' },
            { $set: { site: null } }
        );

        console.log(`✅ Set ${superAdminsResult.modifiedCount} super admin(s) to access all sites (site: null)`);

        // Verify migration
        const regularAdmins = await AdminUser.find({ role: 'admin' });
        const superAdmins = await AdminUser.find({ role: 'super_admin' });

        console.log('\n📊 Migration Summary:');
        console.log(`   Regular Admins: ${regularAdmins.length}`);
        regularAdmins.forEach(admin => {
            console.log(`      - ${admin.name} (${admin.email}) → Site: ${admin.site || 'NONE'}`);
        });

        console.log(`   Super Admins: ${superAdmins.length}`);
        superAdmins.forEach(admin => {
            console.log(`      - ${admin.name} (${admin.email}) → All Sites`);
        });

        console.log('\n✅ Admin site assignment migration completed successfully!');
        console.log('💡 Next steps:');
        console.log('   1. Update admin authentication middleware');
        console.log('   2. Add site filtering to all admin controllers');
        console.log('   3. Update admin management UI with site selector');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateAdminSites();
