const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    // ========================================
    // LINK WITH USER ACCOUNT
    // ========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ========================================
    // PERSONAL DETAILS
    // ========================================

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },

    // ========================================
    // IDENTITY PROOF
    // ========================================

    identityProof: {
      proofType: {
        type: String,
        enum: ["Aadhaar Card", "PAN Card", "Other"],
        default: null,
      },

      documentUrl: {
        type: String,
        default: null,
      },

      documentName: {
        type: String,
        default: null,
      },
    },

    // ========================================
    // COMMUNICATION DETAILS
    // ========================================

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    // ========================================
    // OFFICE PROOF
    // ========================================

    officeProof: {
      documentUrl: {
        type: String,
        default: null,
      },

      documentName: {
        type: String,
        default: null,
      },
    },

    // ========================================
    // GST DETAILS
    // ========================================

    havingGST: {
      type: Boolean,
      default: false,
    },

    gstDocument: {
      documentUrl: {
        type: String,
        default: null,
      },

      documentName: {
        type: String,
        default: null,
      },
    },

    gstName: {
      type: String,
      default: null,
      trim: true,
    },

    companyName: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Agent", agentSchema);