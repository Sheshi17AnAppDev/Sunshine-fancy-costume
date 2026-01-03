const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Site name is required'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Site slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    description: {
        type: String,
        default: ''
    },
    logo: {
        type: String,
        default: ''
    },
    favicon: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    theme: {
        primaryColor: {
            type: String,
            default: '#fbb03b'
        },
        secondaryColor: {
            type: String,
            default: '#e89b25'
        },
        font: {
            type: String,
            default: "'Outfit', sans-serif"
        },
        borderRadius: {
            type: String,
            enum: ['none', 'small', 'medium', 'large', 'full'],
            default: 'medium'
        }
    },
    settings: {
        currency: {
            type: String,
            default: 'INR'
        },
        currencySymbol: {
            type: String,
            default: '₹'
        },
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'Asia/Kolkata'
        },
        enableGuestCheckout: {
            type: Boolean,
            default: true
        },
        requireEmailVerification: {
            type: Boolean,
            default: false
        }
    },
    contact: {
        email: String,
        phone: String,
        whatsapp: String,
        address: String
    },
    seo: {
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
    }
}, {
    timestamps: true
});

// Index for faster lookups
siteSchema.index({ isActive: 1 });

module.exports = mongoose.model('Site', siteSchema);
