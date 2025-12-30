const uploadService = require('../services/uploadService');
const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');

// @desc    Upload media (Image/Video)
// @route   POST /api/upload
// @access  Private (Admin)
exports.uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.file;
        const mimeType = file.mimetype;
        const isImage = mimeType.startsWith('image/');
        const isVideo = mimeType.startsWith('video/');

        // 1. Validation (Size check handled by Multer limits, but safe to double check)
        // 25MB = 25 * 1024 * 1024
        if (file.size > 25 * 1024 * 1024) {
            return res.status(400).json({ message: 'File too large (Max 25MB)' });
        }

        let uploadResult;
        let compressedSize = 0;
        let publicId = '';

        if (isImage) {
            // Processing Image (File from DiskStorage)
            console.log('Processing Image...');

            // Read file from disk
            const inputBuffer = fs.readFileSync(file.path);

            const compressedBuffer = await uploadService.compressImage(inputBuffer);
            compressedSize = compressedBuffer.length;

            // Upload compressed buffer
            const cloudRes = await uploadService.uploadToCloudinary(compressedBuffer, 'image');
            uploadResult = cloudRes.secure_url;
            publicId = cloudRes.public_id;

            // Cleanup Original File
            try { fs.unlinkSync(file.path); } catch (e) { }

        } else if (isVideo) {
            // Processing Video (File Path from DiskStorage)
            console.log('Processing Video...');
            // Compress
            const compressedPath = await uploadService.compressVideo(file.path);
            const stats = fs.statSync(compressedPath);
            compressedSize = stats.size;

            // Upload compressed file
            const cloudRes = await uploadService.uploadToCloudinary(compressedPath, 'video');
            uploadResult = cloudRes.secure_url;
            publicId = cloudRes.public_id;

            // Cleanup temp files
            fs.unlinkSync(file.path);       // Original
            fs.unlinkSync(compressedPath);  // Compressed
        } else {
            return res.status(400).json({ message: 'Invalid file type. Only images and videos allowed.' });
        }

        // 2. Storage in MongoDB
        const media = await Media.create({
            mediaUrl: uploadResult,
            mediaType: isImage ? 'image' : 'video',
            originalName: file.originalname,
            compressedSize: compressedSize,
            publicId: publicId
        });

        res.status(201).json({
            success: true,
            url: media.mediaUrl,
            type: media.mediaType,
            id: media._id
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
};
