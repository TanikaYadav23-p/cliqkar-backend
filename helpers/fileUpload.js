const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(__dirname, "../uploads/airlines");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =====================================================
// STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const fileName =
      `airline-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${ext}`;

    cb(null, fileName);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PNG, JPG, JPEG, WEBP and SVG images are allowed."
      ),
      false
    );
  }
};

// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  upload,
};