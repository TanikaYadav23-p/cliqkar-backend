const mongoose = require("mongoose");

const agentVisaApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referenceNumber: { type: String, required: true, trim: true },
    countryName: { type: String, required: true, trim: true },
    visaTitle: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "Individual" },

    status: {
      type: String,
      enum: ["Approved", "Processing", "Hold", "Draft"],
      default: "Processing",
    },

    applicantName: { type: String, trim: true },
    passportNumber: { type: String, trim: true },

    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AgentVisaApplication",
  agentVisaApplicationSchema
);
