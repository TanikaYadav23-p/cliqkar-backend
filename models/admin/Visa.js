const mongoose = require("mongoose");

const visaSchema = new mongoose.Schema(
  {
    // Where the traveler is going from
    going_from: {
      type: String,
      required: true,
      trim: true,
    },

    // Destination country
    going_to: {
      type: String,
      required: true,
      trim: true,
    },

    // Short description
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // About visa
    about: {
      type: String,
      trim: true,
      default: "",
    },

    // Special specification
    spec: {
      type: String,
      trim: true,
      default: "",
    },

    // Entry type
    entry: {
      type: String,
      required: true,
      trim: true,
    },

    // Visa validity
    validity: {
      type: String,
      required: true,
      trim: true,
    },

    // Visa duration
    duration: {
      type: String,
      required: true,
      trim: true,
    },

    // Required documents
    documents: {
      type: String,
      required: true,
      trim: true,
    },

    // Processing time
    processing_time: {
      type: String,
      required: true,
      trim: true,
    },

    // Adult visa amount
    amount: {
      type: String,
      required: true,
      trim: true,
    },

    // Child visa amount
    child_amount: {
      type: String,
      required: true,
      default: "0",
      trim: true,
    },

    // Absconding fees
    absconding_fees: {
      type: String,
      trim: true,
      default: "",
    },

    // Visa status
    status: {
      type: String,
      enum: ["Active", "Deactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Visa", visaSchema);