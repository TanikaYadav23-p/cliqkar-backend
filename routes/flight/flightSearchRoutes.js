const express = require("express");

const router = express.Router();

const {
  searchFlights,
} = require("../../controllers/flight/flightSearchController");

router.post("/search", searchFlights);

module.exports = router;