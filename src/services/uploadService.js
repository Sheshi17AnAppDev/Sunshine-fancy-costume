const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

ffmpeg.setFfmpegPath(ffmpegPath);

// Cloudinary Config (ensure these are in .env)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error('Missing Cloudinary Environment Variables:', {
        CLOUDINARY_CLOUD_NAME: !!cloudName,
        CLOUDINARY_API_KEY: !!apiKey,
        CLOUDINARY_API_SECRET: !!apiSecret
    });
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

/**
 * Compress Image
 * Target: 100KB - 300KB
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Buffer>}
 */
exports.compressImage = async (buffer) => {
    try {
        let quality = 80;
        let compressedBuffer = await sharp(buffer)
            .jpeg({ quality }) // Convert to JPEG with quality
            .toBuffer();

        // Loop to ensure size constraint (simple approach)
        // If > 300KB, reduce quality
        while (compressedBuffer.length > 300 * 1024 && quality > 10) {
            quality -= 10;
            compressedBuffer = await sharp(buffer)
                .resize({ width: 1920, withoutEnlargement: true }) // Ensure not too huge
                .jpeg({ quality })
                .toBuffer();
        }

        console.log(`Image compressed to: ${(compressedBuffer.length / 1024).toFixed(2)} KB`);
        return compressedBuffer;
    } catch (error) {
        throw new Error('Image compression failed: ' + error.message);
    }
};

/**
 * Compress Video
 * Target: 300KB - 1MB
 * Since FFmpeg runs on files, we usually need to write buffer to temp, process, then read back.
 * However, simpler to rely on Cloudinary transformation OR minimal local processing.
 * User asked for local compression using FFmpeg.
 * @param {string} inputPath - Path to temp input file (Multer should save to disk for videos)
 * @returns {Promise<string>} - Path to compressed output file
 */
exports.compressVideo = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace(/(\.[\w\d]+)$/, '_comp.mp4');

        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .size('720x?') // Resize to 720p width, auto height
            .videoBitrate('800k') // Target bitrate for ~1MB per 10s roughly
            .audioCodec('aac')
            .audioBitrate('128k')
            .on('end', () => {
                console.log('Video compression finished');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Video compression error:', err);
                reject(err);
            })
            .run();
    });
};

/**
 * Upload to Cloudinary
 * @param {string|Buffer} file - File path or buffer
 * @param {string} resource_type - 'image' or 'video'
 * @returns {Promise<object>} - Cloudinary result
 */
exports.uploadToCloudinary = (file, resource_type) => {
    return new Promise((resolve, reject) => {
        console.log(`[Cloudinary] Starting upload for ${resource_type}...`);
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type,
                folder: 'sunshine_uploads'
            },
            (error, result) => {
                if (error) {
                    console.error('[Cloudinary] Upload Error:', error);
                    return reject(error);
                }
                console.log(`[Cloudinary] Success: ${result.secure_url}`);
                resolve(result);
            }
        );

        if (Buffer.isBuffer(file)) {
            console.log('[Cloudinary] Piping buffer...');
            stream.end(file);
        } else {
            console.log('[Cloudinary] Uploading path...');
            // It's a path
            cloudinary.uploader.upload(file, {
                resource_type,
                folder: 'sunshine_uploads'
            }, (err, res) => {
                if (err) {
                    console.error('[Cloudinary] Path Upload Error:', err);
                    return reject(err);
                }
                console.log(`[Cloudinary] Success: ${res.secure_url}`);
                resolve(res);
            });
        }
    });
};
