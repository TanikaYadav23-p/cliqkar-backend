const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.pre("save", function (next) {
  if (!this.ticketId) {
    this.ticketId =
      "#" + Math.floor(10000000 + Math.random() * 90000000);
  }

  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);