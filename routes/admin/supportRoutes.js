const express = require("express");

const {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
} = require("../../controllers/admin/supportController");



const router = express.Router();

// All support APIs require logged-in admin


router.get("/", getAllTickets);

router.get("/:id", getTicketById);

router.patch("/:id", updateTicketStatus);

module.exports = router;