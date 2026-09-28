
const express = require('express');
const router = express.Router();

const {
  protect,
  adminOnly
} = require('../../middleware/authMiddleware');

const {
  getVisaApplications,
  updateVisaApplication
} = require('../../controllers/admin/visaApplicationController');

router.get(
  '/',
  protect,
  adminOnly,
  getVisaApplications
);

router.patch(
  '/:id',
  protect,
  adminOnly,
  updateVisaApplication
);

module.exports = router;