const express = require("express");

const router = express.Router();

const {
  protect,
  adminOnly,
} = require("../../middleware/authMiddleware");

const {
  addAirport,
  getAirports,
  getAirportById,
  updateAirport,
  deleteAirport,
  updateAirportStatus,
} = require("../../controllers/admin/AirportController");


// ===============================
// GET AIRPORT LIST
// ===============================
router.get(
  "/",
  protect,
  adminOnly,
  getAirports
);


// ===============================
// ADD AIRPORT
// ===============================
router.post(
  "/",
  protect,
  adminOnly,
  addAirport
);


// ===============================
// GET SINGLE AIRPORT
// ===============================
router.get(
  "/:id",
  protect,
  adminOnly,
  getAirportById
);


// ===============================
// UPDATE AIRPORT
// ===============================
router.put(
  "/:id",
  protect,
  adminOnly,
  updateAirport
);


// ===============================
// DELETE AIRPORT
// ===============================
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteAirport
);


// ===============================
// UPDATE AIRPORT STATUS
// ===============================
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  updateAirportStatus
);


module.exports = router;