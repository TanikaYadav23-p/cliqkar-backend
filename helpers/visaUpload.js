
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(
  __dirname,
  '../uploads/visa-applications'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    cb(
      null,
      `visa-${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`
    );
  }
});

const uploadVisaFiles = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 40
  },

  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(
      new Error(
        'Visa documents must be PDF, JPG, PNG, or WEBP files.'
      )
    );
  }
});

module.exports = { uploadVisaFiles };