const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Site = require('../src/models/Site');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Brand = require('../src/models/Brand');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const SiteContent = require('../src/models/SiteContent');

async function migrateToMultiSite() {
    try {
        console.log('🔄 Starting multi-site migration...');
        console.log('Connecting to MongoDB Atlas...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        // Step 1: Create default site
        console.log('📝 Step 1: Creating default site...');
        let defaultSite = await Site.findOne({ slug: 'sunshine' });

        if (!defaultSite) {
            defaultSite = await Site.create({
                name: 'Sunshine Fancy Costumes',
                slug: 'sunshine',
                description: 'Your premier destination for fancy costumes and party wear',
                isActive: true,
                theme: {
                    primaryColor: '#fbb03b',
                    secondaryColor: '#e89b25',
                    font: "'Outfit', sans-serif",
                    borderRadius: 'medium'
                },
                settings: {
                    currency: 'INR',
                    currencySymbol: '₹',
                    language: 'en',
                    timezone: 'Asia/Kolkata'
                }
            });
            console.log('✅ Default site created:', defaultSite.name);
        } else {
            console.log('ℹ️  Default site already exists:', defaultSite.name);
        }

        // Step 2: Migrate existing data
        console.log('\n📦 Step 2: Migrating existing data...');

        const updates = [
            { model: Product, name: 'Products' },
            { model: Category, name: 'Categories' },
            { model: Brand, name: 'Brands' },
            { model: Order, name: 'Orders' },
            { model: User, name: 'Users' },
            { model: SiteContent, name: 'Site Content' }
        ];

        for (const { model, name } of updates) {
            // Count documents without site field
            const count = await model.countDocuments({ site: { $exists: false } });

            if (count > 0) {
                const result = await model.updateMany(
                    { site: { $exists: false } },
                    { $set: { site: defaultSite._id } }
                );
                console.log(`✅ Migrated ${result.modifiedCount} ${name} to default site`);
            } else {
                console.log(`ℹ️  ${name}: Already migrated or empty`);
            }
        }

        console.log('\n✨ Migration completed successfully!');
        console.log('\n📊 Final Stats:');
        console.log(`   Sites: ${await Site.countDocuments()}`);
        console.log(`   Products: ${await Product.countDocuments({ site: defaultSite._id })}`);
        console.log(`   Categories: ${await Category.countDocuments({ site: defaultSite._id })}`);
        console.log(`   Brands: ${await Brand.countDocuments({ site: defaultSite._id })}`);
        console.log(`   Orders: ${await Order.countDocuments({ site: defaultSite._id })}`);
        console.log(`   Users: ${await User.countDocuments({ site: defaultSite._id })}`);
        console.log(`   Site Content: ${await SiteContent.countDocuments({ site: defaultSite._id })}`);

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Migration failed:', err);
        process.exit(1);
    }
}

migrateToMultiSite();
