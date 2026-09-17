const mongoose = require("mongoose");

const airlineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

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

module.exports = mongoose.model("Airline", airlineSchema);