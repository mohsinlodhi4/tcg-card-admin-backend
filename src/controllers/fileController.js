const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validTypes = ['products', 'users'];
const { errorResponse, successResponse } = require('../utils/functions');
const UPLOAD_DIR_PATH = 'public/uploads'

module.exports = {
    uploadFile
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('file');

function uploadFile(req, res){
    upload(req, res, (err) => {
        // Handle file size limit error
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json(errorResponse('File size should not exceed 5MB'));
        }
        // Handle other multer errors
        if (err) {
            console.log("File upload error", err)
            return res.status(500).json(errorResponse('File upload failed', { error: err.message}));
        }

        const { type } = req.body;

        // Validate type
        if (!validTypes.includes(type)) {
            return res.status(400).json(errorResponse(`'type' must be one of: ${validTypes.join(', ')}`));
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Ensure upload folder exists
        let uploadDir = path.join(process.cwd(), UPLOAD_DIR_PATH);
        if(type) {
            uploadDir += '/' + type
        }
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Create unique file name
        const ext = path.extname(req.file.originalname);
        const fileName = `file-${Date.now()}${ext}`;
        const fullPath = path.join(uploadDir, fileName);

        // Save file to disk
        fs.writeFile(fullPath, req.file.buffer, (fsErr) => {
            if (fsErr) {
                return res.status(500).json(errorResponse('Failed to save file'));
            }

            const filePath = `${type}/${fileName}`;
            res.json(successResponse("File uploaded successfully.", { fileName, filePath }));
        });
    });
}