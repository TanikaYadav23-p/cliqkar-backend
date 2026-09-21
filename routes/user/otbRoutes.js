const express = require("express");

const router = express.Router();

const {
  protect,
} = require("../../middleware/authMiddleware");

const {
  createOtbApplication,getMyOtbApplications
} = require("../../controllers/admin/otbApplicationController");

const {
  upload
} = require("../../helpers/fileUpload");

/*
  IMPORTANT

  This assumes your upload helper uses multer.

  If your existing upload helper is configured
  differently, keep that configuration and only
  change the middleware line accordingly.
*/

router.post(
  "/apply",
  upload.any(),
  protect,
  createOtbApplication
);
router.get(
  "/my-applications",
  protect,
  getMyOtbApplications
);

module.exports = router;