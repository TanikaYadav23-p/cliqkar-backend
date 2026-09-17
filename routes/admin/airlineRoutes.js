const express = require("express");

const router = express.Router();

const {
  protect,
  adminOnly,
} = require("../../middleware/authMiddleware");

const {
  addAirline,
  getAirlines,
  getAirlineById,
  updateAirline,
  deleteAirline,
  updateAirlineStatus,
  createOrUpdateAirlinePrice,
  getAirlinePrices,
  getAirlinePrice,
} = require("../../controllers/admin/airlineController");
const { upload } = require("../../helpers/fileUpload");

router.get("/", protect, adminOnly, getAirlines);

router.post(
    "/",
    protect,
    adminOnly,
    upload.single("logo"),
    addAirline
  );

// =====================================================
// AIRLINE PRICE ROUTES
// =====================================================

router.get(
  "/prices/list",
  protect,
  adminOnly,
  getAirlinePrices
);

router.get(
  "/prices",
  protect,
  adminOnly,
  getAirlinePrice
);

router.post(
  "/prices",
  protect,
  adminOnly,
  createOrUpdateAirlinePrice
);

// =====================================================
// SINGLE AIRLINE ROUTES
// =====================================================

router.get(
  "/:id",
  protect,
  adminOnly,
  getAirlineById
);

router.put(
    "/:id",
    protect,
    adminOnly,
    upload.single("logo"),
    updateAirline
  );

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteAirline
);

router.patch(
  "/:id/status",
  protect,
  adminOnly,
  updateAirlineStatus
);


// ======================================
// AIRLINE PRICE LIST
// ======================================
router.get(
  "/prices/list",
  protect,
  adminOnly,
  getAirlinePrices
);


// ======================================
// GET AIRLINE PRICE
// ======================================
router.get(
  "/prices",
  protect,
  adminOnly,
  getAirlinePrice
);


// ======================================
// CREATE / UPDATE AIRLINE PRICE
// ======================================
router.post(
  "/prices",
  protect,
  adminOnly,
  createOrUpdateAirlinePrice
);


module.exports = router;