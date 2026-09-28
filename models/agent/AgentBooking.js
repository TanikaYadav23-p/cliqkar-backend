const mongoose = require("mongoose");

const agentBookingSchema = new mongoose.Schema(
  {
    // Login account (User doc) jiska yeh booking hai
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referenceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    airlineCode: { type: String, trim: true },
    airlineName: { type: String, trim: true },
    flightNumber: { type: String, trim: true },

    status: {
      type: String,
      enum: ["Success", "Processing", "Cancelled"],
      default: "Processing",
    },

    departure: {
      time: String,
      code: String,
      airport: String,
    },

    arrival: {
      time: String,
      code: String,
      airport: String,
    },

    duration: { type: String, trim: true },

    passengerName: { type: String, trim: true },
    pnr: { type: String, trim: true },
    cabinClass: { type: String, trim: true },

    price: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AgentBooking", agentBookingSchema);
