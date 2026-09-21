const express = require("express");

const {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
} = require("../../controllers/admin/agentlistController");
const { protect, adminOnly } = require("../../middleware/authMiddleware");
const router = express.Router();


router.use(protect);
router.use(adminOnly);

// Get all agents
router.get("/", getAgents);

// Create new agent
router.post("/", createAgent);

// Get single agent
router.get("/:id", getAgentById);

// Update agent
router.put("/:id", updateAgent);

// Delete agent
router.delete("/:id", deleteAgent);

module.exports = router;