const express = require("express");
const router = express.Router();

const {
  addVisa,
  getVisas,
  getVisaById,
  updateVisa,
  deleteVisa,
  updateVisaStatus,
} = require("../../controllers/admin/visaController");

const {
  protect,
  adminOnly,
} = require("../../middleware/authMiddleware");


// =====================================================
// VISA MASTER ROUTES
// =====================================================

// Get all visas
router.get(
  "/",
  
  getVisas
);


// Add new visa
router.post(
  "/",
  protect,
  adminOnly,
  addVisa
);


// Get single visa
router.get(
  "/:id",
  
  getVisaById
);


// Update visa
router.put(
  "/:id",
  protect,
  adminOnly,
  updateVisa
);


// Delete visa
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteVisa
);


// Update status
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  updateVisaStatus
);


module.exports = router;