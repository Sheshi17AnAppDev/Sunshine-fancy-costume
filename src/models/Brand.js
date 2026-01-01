const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    site: {
        type: mongoose.Schema.ObjectId,
        ref: 'Site',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please add a brand name'],
        trim: true
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/150?text=Brand+Logo'
    },
    description: {
        type: String,
        trim: true
    },
    count: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Unique brand name per site
brandSchema.index({ site: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);
