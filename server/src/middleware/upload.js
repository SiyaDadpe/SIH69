/**
 * File Upload Middleware
 * 
 * Handles multipart/form-data file uploads using multer.
 * Stores uploaded files in the uploads directory.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Uploads directory created', { path: uploadsDir });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomString-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter - restrict file types
const fileFilter = (req, file, cb) => {
  // Allowed file types for reports and data imports
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Max 5 files per request
  }
});

// Error handler middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    let message = 'File upload error';
    let statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds 10MB limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 5 files allowed';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name';
        break;
      default:
        message = err.message;
    }

    logger.warn('Multer upload error', {
      code: err.code,
      message: message,
      field: err.field
    });

    return res.status(statusCode).json({
      success: false,
      error: message,
      code: err.code
    });

  } else if (err) {
    // Other errors (file type, custom validation, etc.)
    logger.error('Upload error', {
      error: err.message,
      stack: err.stack
    });

    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  next();
};

module.exports = {
  upload,
  handleUploadError,
  uploadsDir
};
