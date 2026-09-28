
const express = require('express');
const router = express.Router();

const {
  protect
} = require('../../middleware/authMiddleware');

const {
  uploadVisaFiles
} = require('../../helpers/visaUpload');

const {
  createVisaApplication,
  getMyVisaApplications
} = require('../../controllers/admin/visaApplicationController');

router.post(
  '/apply',
  protect,
  uploadVisaFiles.any(),
  createVisaApplication
);

router.get(
  '/my-applications',
  protect,
  getMyVisaApplications
);

module.exports = router;