const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a brand name'],
        trim: true,
        unique: true
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

module.exports = mongoose.model('Brand', brandSchema);
