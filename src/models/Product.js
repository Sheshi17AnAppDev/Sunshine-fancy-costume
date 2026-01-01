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
    originalPrice: {
        type: Number,
        default: 0
    },
    site: {
        type: mongoose.Schema.ObjectId,
        ref: 'Site',
        required: true,
        index: true
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
    sizePrices: [
        {
            size: String,  // e.g., "S", "M", "L", "XL", "XXL"
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
})

// Indexes for performance
productSchema.index({ site: 1, category: 1 });
productSchema.index({ site: 1, isFeatured: 1 });
productSchema.index({ site: 1, isPopular: 1 });

module.exports = mongoose.model('Product', productSchema);
