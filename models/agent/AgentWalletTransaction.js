const mongoose = require("mongoose");

const agentWalletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit", "refund"],
      required: true,
    },

    title: { type: String, required: true, trim: true },
    reference: { type: String, trim: true },

    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AgentWalletTransaction",
  agentWalletTransactionSchema
);
