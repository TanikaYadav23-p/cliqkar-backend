const express = require("express");

const {
  createContactTicket,
} = require("../../controllers/user/contactController");

const router = express.Router();

router.post("/", createContactTicket);

module.exports = router;