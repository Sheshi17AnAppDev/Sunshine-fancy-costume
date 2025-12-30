const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: mongoose.Schema.ObjectId,
        ref: 'Brand',
        required: false
    },
    images: [
        {
            url: String,
            public_id: String
        }
    ],
    video: {
        url: String,
        public_id: String
    },
    countInStock: {
        type: Number,
        required: true,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    agePrices: [
        {
            ageGroup: String,
            price: Number
        }
    ],
    views: {
        type: Number,
        default: 0
    },
    bookedCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
