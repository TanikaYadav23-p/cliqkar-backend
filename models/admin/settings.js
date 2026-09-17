const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    // ========================================
    // ADMIN RELATION
    // ========================================

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true,
      index: true,
    },

    // ========================================
    // CORE AGENCY & FEE RULES
    // ========================================

    coreAgency: {
      adminName: {
        type: String,
        default: "",
        trim: true,
      },

      masterOverrideKey: {
        type: String,
        default: "",
      },

      flightAgencyCharge: {
        type: String,
        default: "350",
      },

      visaAgencyCharge: {
        type: String,
        default: "500",
      },

      otbBoardCharge: {
        type: String,
        default: "0",
      },

      childVisaPriceUAE: {
        type: String,
        default: "6200",
      },

      insuranceBaseUAE: {
        type: String,
        default: "19",
      },

      etravUrlProd: {
        type: String,
        default: "",
      },

      etravUrlUat: {
        type: String,
        default: "",
      },

      etravUatUserName: {
        type: String,
        default: "",
      },

      etravUatPassword: {
        type: String,
        default: "",
      },

      etravProdUserName: {
        type: String,
        default: "",
      },

      etravProdPassword: {
        type: String,
        default: "",
      },

      etravCharge: {
        type: String,
        default: "300",
      },

      etravEnable: {
        type: String,
        enum: ["UAT", "PROD"],
        default: "UAT",
      },

      airiqUrlUat: {
        type: String,
        default: "",
      },

      airiqUrlProd: {
        type: String,
        default: "",
      },

      airiqUatUserName: {
        type: String,
        default: "",
      },

      airiqUatPassword: {
        type: String,
        default: "",
      },

      airiqProdUserName: {
        type: String,
        default: "",
      },

      airiqProdPassword: {
        type: String,
        default: "",
      },

      airiqCharge: {
        type: String,
        default: "300",
      },

      airiqEnable: {
        type: String,
        enum: ["UAT", "PROD"],
        default: "UAT",
      },

      goflyCharge: {
        type: String,
        default: "400",
      },

      vinflyCharge: {
        type: String,
        default: "400",
      },

      aiToolUrl: {
        type: String,
        default: "",
      },

      aiToolUserName: {
        type: String,
        default: "",
      },

      aiToolPassword: {
        type: String,
        default: "",
      },

      brandLogo: {
        type: String,
        default: "",
      },
    },

    // ========================================
    // EASEBUZZ PAYMENT GATEWAY
    // ========================================

    paymentGateway: {
      easebuzzKeyTest: {
        type: String,
        default: "",
      },

      easebuzzKeyProd: {
        type: String,
        default: "",
      },

      easebuzzSaltTest: {
        type: String,
        default: "",
      },

      easebuzzSaltProd: {
        type: String,
        default: "",
      },

      easebuzzEnable: {
        type: String,
        enum: ["UAT", "PROD"],
        default: "UAT",
      },
    },

    // ========================================
    // APP & FIREBASE
    // ========================================

    appFirebase: {
      appName: {
        type: String,
        default: "Cliqkar",
        trim: true,
      },

      appVersion: {
        type: String,
        default: "1.0",
        trim: true,
      },

      appLogo: {
        type: String,
        default: "",
      },

      firebaseConfig: {
        type: String,
        default: "",
      },
    },

    // ========================================
    // SUPPORT & OPS
    // ========================================

    supportOps: {
      supportMobile: {
        type: String,
        default: "",
      },

      whatsappSupport: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      supportEmail: {
        type: String,
        default: "",
      },

      supportStartTime: {
        type: String,
        default: "",
      },

      supportEndTime: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Settings",
  SettingsSchema
);