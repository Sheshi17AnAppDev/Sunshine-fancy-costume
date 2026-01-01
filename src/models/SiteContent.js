const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema(
    {
        site: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Site',
            required: true,
            index: true
        },
        key: {
            type: String,
            required: true,
            trim: true
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AdminUser'
        }
    },
    {
        timestamps: true
    }
);

// Unique key per site
siteContentSchema.index({ site: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
