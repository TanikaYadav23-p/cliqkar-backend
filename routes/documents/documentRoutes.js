const express = require("express");
const router = express.Router();

const {
  extractPassportData,
  extractPanData,
} = require("../../controllers/documents/documentController");

const { protect } = require("../../middleware/authMiddleware");

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Passport
router.post(
  "/extract-passport",
  protect,
  upload.single("document"),
  extractPassportData
);

// PAN Card
router.post(
  "/extract-pan",
  protect,
  upload.single("document"),
  extractPanData
);

module.exports = router;