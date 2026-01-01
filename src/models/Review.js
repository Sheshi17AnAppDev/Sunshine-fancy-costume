const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    user: {
        type: String, // "Guest" or User Name
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    site: {
        type: mongoose.Schema.ObjectId,
        ref: 'Site',
        required: true,
        index: true
    },
    status: {
        type: String, // pending, approved, rejected
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' // Admin reviews will be auto-approved
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Review', reviewSchema);
