const mongoose = require("mongoose");

const airlinePriceSchema = new mongoose.Schema(
  {
    airline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Airline",
      required: false,
    },

    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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

airlinePriceSchema.index(
    {
      airline: 1,
      country: 1,
    },
    {
      unique: true,
    }
  );
  

module.exports = mongoose.model("AirlinePrice", airlinePriceSchema);