const express = require("express");

const {
  initiatePayment,
  paymentSuccess,
  paymentFailure,
} = require("../../controllers/payment/paymentController");

const router = express.Router();

router.post("/initiate", initiatePayment);

router.post("/success", paymentSuccess);

router.post("/failure", paymentFailure);

module.exports = router;