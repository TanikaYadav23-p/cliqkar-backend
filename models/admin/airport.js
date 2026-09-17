const mongoose = require("mongoose");

const airportSchema = new mongoose.Schema(
  {
    airportName: {
      type: String,
      required: true,
      trim: true,
    },

    airportCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    countryName: {
      type: String,
      required: true,
      trim: true,
    },

    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    cityName: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: String,
      trim: true,
    },

    longitude: {
      type: String,
      trim: true,
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

module.exports = mongoose.model("Airport", airportSchema);