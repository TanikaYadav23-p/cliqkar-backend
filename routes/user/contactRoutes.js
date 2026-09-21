const express = require("express");

const {
  createContactTicket,
} = require("../../controllers/user/contactController");
const {
  protect,
} = require("../../middleware/authMiddleware");
const router = express.Router();

router.post("/",protect, createContactTicket);

module.exports = router;