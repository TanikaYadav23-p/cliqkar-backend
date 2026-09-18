const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const travelerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  pnr: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },

  dob: {
    type: String,
    required: true,
  },

  passportFront: {
    type: documentSchema,
    default: null,
  },

  passportBack: {
    type: documentSchema,
    default: null,
  },

  visa: {
    type: documentSchema,
    default: null,
  },

  fromTicket: {
    type: documentSchema,
    default: null,
  },

  toTicket: {
    type: documentSchema,
    default: null,
  },
});

const otbApplicationSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    goingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      default: null,
    },

    countryName: {
      type: String,
      required: true,
      trim: true,
    },

    airline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Airline",
      default: null,
    },

    airlineName: {
      type: String,
      required: true,
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      default: "online",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Not Required"],
      default: "Pending",
    },

    status: {
      type: String,
      enum: ["Pending", "In Process", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    workingStatus: {
      type: String,
      enum: ["Pending", "In Process", "Approved", "Rejected"],
      default: "Pending",
    },

    applicantEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    applicantPhone: {
      type: String,
      trim: true,
      default: "",
    },

    agentName: {
      type: String,
      trim: true,
      default: "",
    },

    applicantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    travelers: {
      type: [travelerSchema],
      required: true,
      validate: [
        (value) => Array.isArray(value) && value.length > 0,
        "At least one traveler is required.",
      ],
    },

    adminNote: {
      type: String,
      default: "",
    },

    statusUpdatedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

otbApplicationSchema.index({
  createdAt: -1,
});

otbApplicationSchema.index({
  applicantEmail: 1,
});

otbApplicationSchema.index({
  "travelers.pnr": 1,
});

module.exports = mongoose.model(
  "OTBApplication",
  otbApplicationSchema
);