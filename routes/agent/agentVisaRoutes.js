const express = require("express");

const {
  getMyVisaApplications,
} = require("../../controllers/agent/agentVisaController");
const { protect, agentOnly } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(agentOnly);

router.get("/my-applications", getMyVisaApplications);

module.exports = router;
