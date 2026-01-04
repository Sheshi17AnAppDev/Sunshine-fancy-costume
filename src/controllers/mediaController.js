const fs = require('fs');
const path = require('path');

// @desc    List all uploaded media files
// @route   GET /api/media
// @access  Private (Admin)
exports.listMedia = async (req, res) => {
    const directoryPath = path.join(__dirname, '../../uploads');

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Unable to scan files!' });
        }

        const fileInfos = files.map((file) => {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);

            // Basic filtering to ensure we only show relevant files if needed
            // For now, showing all files in uploads/
            return {
                name: file,
                url: `/uploads/${file}`,
                size: stats.size,
                createdAt: stats.birthtime
            };
        });

        // Sort by newest first
        fileInfos.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json(fileInfos);
    });
};

// @desc    Delete a media file
// @route   DELETE /api/media/:filename
// @access  Private (Admin)
exports.deleteMedia = async (req, res) => {
    const filename = req.params.filename;
    const directoryPath = path.join(__dirname, '../../uploads');
    const filePath = path.join(directoryPath, filename);

    // Security check: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ message: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not delete the file.' + err });
        }

        res.status(200).json({ message: 'File deleted successfully' });
    });
};
