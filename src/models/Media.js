const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    originalName: {
        type: String
    },
    compressedSize: {
        type: Number, // in bytes
        required: true
    },
    dimension: {
        width: Number,
        height: Number
    },
    duration: {
        type: Number // for videos, in seconds
    },
    publicId: {
        type: String // Cloudinary public_id
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Media', mediaSchema);
