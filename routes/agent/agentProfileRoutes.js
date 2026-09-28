const express = require("express");

const {
  getMyAgentProfile,
  updateMyAgentProfile,
} = require("../../controllers/agent/agentProfileController");

const { protect, agentOnly } = require("../../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// ALL AGENT PROFILE ROUTES REQUIRE LOGIN + AGENT ROLE
// =====================================================

router.use(protect);
router.use(agentOnly);

// GET  /api/agent/profile/me
router.get("/me", getMyAgentProfile);

// PUT  /api/agent/profile/personal
router.put("/personal", updateMyAgentProfile);

module.exports = router;
