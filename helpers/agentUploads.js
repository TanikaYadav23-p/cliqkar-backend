const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDir = path.join(
  __dirname,
  "../uploads/agents"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ========================================
// STORAGE
// ========================================

const storage =
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
      const ext =
        path.extname(
          file.originalname
        );

      const name =
        path
          .basename(
            file.originalname,
            ext
          )
          .replace(
            /[^a-zA-Z0-9]/g,
            "-"
          );

      cb(
        null,
        `${Date.now()}-${name}${ext}`
      );
    },
  });

// ========================================
// FILE FILTER
// ========================================

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, JPG, JPEG and PNG files are allowed"
      ),
      false
    );
  }
};

// ========================================
// MULTER
// ========================================

const agentUpload =
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize:
        5 * 1024 * 1024,
    },
  });

module.exports = agentUpload;