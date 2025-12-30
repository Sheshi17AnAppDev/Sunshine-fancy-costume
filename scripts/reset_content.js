require('dotenv').config();
const mongoose = require('mongoose');
const SiteContent = require('../src/models/SiteContent');
const connectDB = require('../src/config/db');

const resetContent = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const keysToDelete = ['about', 'contact', 'blog', 'faq', 'theme'];

        console.log(`Deleting content for keys: ${keysToDelete.join(', ')}`);

        const res = await SiteContent.deleteMany({ key: { $in: keysToDelete } });

        console.log(`Deleted ${res.deletedCount} documents.`);
        console.log('Done. The next API request will regenerate these with updated defaults.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetContent();
