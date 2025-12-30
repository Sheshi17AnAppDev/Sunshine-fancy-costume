const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/adminAuthMiddleware');

// Storage Config
// We need DiskStorage for Videos (FFmpeg needs file path)
// We utilize MemoryStorage for Images (Sharp works with Buffers)
// Multer doesn't switch dynamically easily in one middleware.
// Strategy: Use DiskStorage for everything to be safe for FFmpeg, 
// and read file to buffer for Sharp if needed?
// OR: Use MemoryStorage, but write to temp file for FFmpeg?
// BEST: DiskStorage. Sharp can take file path input too.

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure uploads folder exists
        const fs = require('fs');
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Since the Requirement said: "Code Quality - Clean temporary files"
// and "Videos: Compress using FFmpeg", we need files on disk for FFmpeg.
// For Sharp, we can read from disk.

// However, to strictly follow "Accept image and video... Single endpoint",
// we configure one multer instance.

const upload = multer({
    storage: storage, // Using DiskStorage
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|mp4|mov|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (jpg,png,webp) and videos (mp4,mov,webm) are allowed!'));
        }
    }
});

// Route
// Note: We need to adapt the Controller. 
// My previous Controller assumed `file.buffer` for images (MemoryStorage) and `file.path` for videos.
// Since I switched to DiskStorage here for uniformity, I must update Controller to read file for Sharp.

// Route with Error Handling for Multer
router.post('/', protect, (req, res, next) => {
    upload.single('file')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ message: `Upload Error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ message: err.message });
        }
        // Everything went fine.
        next();
    });
}, async (req, res, next) => {
    // Inject buffer for Image if using DiskStorage? 
    // I updated Controller to read fs if file.buffer is missing.
    next();
}, uploadController.uploadMedia);

module.exports = router;
