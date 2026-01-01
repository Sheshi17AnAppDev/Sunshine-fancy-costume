const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    site: {
        type: mongoose.Schema.ObjectId,
        ref: 'Site',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    image: {
        type: String,
        default: 'no-photo.jpg'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Unique category name per site
categorySchema.index({ site: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
