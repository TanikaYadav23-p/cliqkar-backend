const express = require("express");

const {
  getMyWalletTransactions,
} = require("../../controllers/agent/agentWalletController");
const { protect, agentOnly } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(agentOnly);

router.get("/my-transactions", getMyWalletTransactions);

module.exports = router;
