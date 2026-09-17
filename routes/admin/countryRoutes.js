const express = require("express");

const router = express.Router();

const {
  protect,
  adminOnly,
} = require("../../middleware/authMiddleware");

const {
  addCountry,
  getCountries,
  getCountryById,
  updateCountry,
  deleteCountry,
  updateCountryStatus,
} = require("../../controllers/admin/countryController");

// Get Country List
router.get("/", protect, adminOnly, getCountries);

// Add Country
router.post("/", protect, adminOnly, addCountry);

// Get Single Country
router.get("/:id", protect, adminOnly, getCountryById);

// Update Country
router.put("/:id", protect, adminOnly, updateCountry);

// Delete Country
router.delete("/:id", protect, adminOnly, deleteCountry);

// Update Country Status
router.patch("/:id/status", protect, adminOnly, updateCountryStatus);

module.exports = router;