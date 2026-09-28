const express = require("express");

const { getMyBookings } = require("../../controllers/agent/agentBookingController");
const { protect, agentOnly } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(agentOnly);

router.get("/my-bookings", getMyBookings);

module.exports = router;
