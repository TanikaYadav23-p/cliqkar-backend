const express = require("express");

const router = express.Router();

const {
  protect,
  adminOnly,
} = require("../../middleware/authMiddleware");

const {
  getOtbApplications,
  getOtbApplicationStats,
  getOtbApplicationById,
  updateOtbApplication,
  searchOtbApplications,
} = require("../../controllers/admin/otbApplicationController");

/*
=========================================================
ADMIN OTB APPLICATION ROUTES
=========================================================
*/

/* Stats */
router.get(
  "/stats",
  protect,
  adminOnly,
  getOtbApplicationStats
);

/* Search */
router.post(
  "/search",
  protect,
  adminOnly,
  searchOtbApplications
);

/* List */
router.get(
  "/",
  protect,
  adminOnly,
  getOtbApplications
);

/* Single application */
router.get(
  "/:id",
  protect,
  adminOnly,
  getOtbApplicationById
);

/* Update status/details */
router.patch(
  "/:id",
  protect,
  adminOnly,
  updateOtbApplication
);

module.exports = router;