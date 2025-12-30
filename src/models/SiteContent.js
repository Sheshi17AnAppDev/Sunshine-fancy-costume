const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
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

module.exports = mongoose.model('SiteContent', siteContentSchema);
