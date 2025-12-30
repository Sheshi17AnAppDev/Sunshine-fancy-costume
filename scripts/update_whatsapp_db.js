const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SiteContent = require('../src/models/SiteContent');

console.log('Script started...');

const updateWhatsApp = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing in environment variables');
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const filter = { key: 'contact' };
        const update = { $set: { 'data.whatsapp': '919704022443' } };

        const result = await SiteContent.findOneAndUpdate(filter, update, { new: true });

        if (result) {
            console.log('SUCCESS: WhatsApp number updated in database.');
            console.log('New Value:', result.data.whatsapp);
        } else {
            console.log('WARNING: Contact document not found. Attempting to create it...');
            // Fallback: Create if not exists (though controller prevents this usually)
            const newDoc = await SiteContent.create({ key: 'contact', data: { whatsapp: '919704022443' } });
            console.log('Created new contact document:', newDoc.data.whatsapp);
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
};

updateWhatsApp();
