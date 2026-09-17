const PlatformSettings = require("../../models/admin/settings");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");

// ========================================
// GET /api/admin/platform-settings/core-agency
// ========================================

const getCoreAgencySettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = await PlatformSettings.create({
        adminId: req.admin.id,
        coreAgency: {
          adminName: req.admin.name,
        },
      });
    }

    const data = settings.coreAgency.toObject();

    // Always use currently logged-in admin name
    data.adminName = req.admin.name;

    return sendSuccess(
      res,
      200,
      "Core agency settings fetched successfully",
      {
        data,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to fetch core agency settings"
    );
  }
};

// ========================================
// SAVE / UPDATE CORE
// ========================================

const saveCoreAgencySettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = new PlatformSettings({
        adminId: req.admin.id,
      });
    }

    const allowedFields = [
      "masterOverrideKey",
      "flightAgencyCharge",
      "visaAgencyCharge",
      "otbBoardCharge",
      "childVisaPriceUAE",
      "insuranceBaseUAE",
      "etravUrlProd",
      "etravUrlUat",
      "etravUatUserName",
      "etravUatPassword",
      "etravProdUserName",
      "etravProdPassword",
      "etravCharge",
      "etravEnable",
      "airiqUrlUat",
      "airiqUrlProd",
      "airiqUatUserName",
      "airiqUatPassword",
      "airiqProdUserName",
      "airiqProdPassword",
      "airiqCharge",
      "airiqEnable",
      "goflyCharge",
      "vinflyCharge",
      "aiToolUrl",
      "aiToolUserName",
      "aiToolPassword",
      "brandLogo",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings.coreAgency[field] = req.body[field];
      }
    });

    // Admin name comes from logged-in admin
    settings.coreAgency.adminName = req.admin.name;

    await settings.save();

    return sendSuccess(
      res,
      200,
      "Core agency settings saved successfully",
      {
        data: settings.coreAgency,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to save core agency settings"
    );
  }
};

// ========================================
// GET PAYMENT GATEWAY
// ========================================

const getPaymentGatewaySettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = await PlatformSettings.create({
        adminId: req.admin.id,
      });
    }

    return sendSuccess(
      res,
      200,
      "Payment gateway settings fetched successfully",
      {
        data: settings.paymentGateway,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to fetch payment gateway settings"
    );
  }
};

// ========================================
// SAVE / UPDATE PAYMENT GATEWAY
// ========================================

const savePaymentGatewaySettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = new PlatformSettings({
        adminId: req.admin.id,
      });
    }

    const allowedFields = [
      "easebuzzKeyTest",
      "easebuzzKeyProd",
      "easebuzzSaltTest",
      "easebuzzSaltProd",
      "easebuzzEnable",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings.paymentGateway[field] = req.body[field];
      }
    });

    await settings.save();

    return sendSuccess(
      res,
      200,
      "Easebuzz settings saved successfully",
      {
        data: settings.paymentGateway,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to save payment gateway settings"
    );
  }
};

// ========================================
// GET APP & FIREBASE
// ========================================

const getAppFirebaseSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = await PlatformSettings.create({
        adminId: req.admin.id,
      });
    }

    return sendSuccess(
      res,
      200,
      "App and Firebase settings fetched successfully",
      {
        data: settings.appFirebase,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to fetch app and Firebase settings"
    );
  }
};

// ========================================
// SAVE / UPDATE APP & FIREBASE
// ========================================

const saveAppFirebaseSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = new PlatformSettings({
        adminId: req.admin.id,
      });
    }

    const allowedFields = [
      "appName",
      "appVersion",
      "appLogo",
      "firebaseConfig",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings.appFirebase[field] = req.body[field];
      }
    });

    await settings.save();

    return sendSuccess(
      res,
      200,
      "App and Firebase settings saved successfully",
      {
        data: settings.appFirebase,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to save app and Firebase settings"
    );
  }
};

// ========================================
// GET SUPPORT & OPS
// ========================================

const getSupportOpsSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = await PlatformSettings.create({
        adminId: req.admin.id,
      });
    }

    return sendSuccess(
      res,
      200,
      "Support and operations settings fetched successfully",
      {
        data: settings.supportOps,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to fetch support and operations settings"
    );
  }
};

// ========================================
// SAVE / UPDATE SUPPORT & OPS
// ========================================

const saveSupportOpsSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({
      adminId: req.admin.id,
    });

    if (!settings) {
      settings = new PlatformSettings({
        adminId: req.admin.id,
      });
    }

    const allowedFields = [
      "supportMobile",
      "whatsappSupport",
      "address",
      "supportEmail",
      "supportStartTime",
      "supportEndTime",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings.supportOps[field] = req.body[field];
      }
    });

    await settings.save();

    return sendSuccess(
      res,
      200,
      "Support and operations settings saved successfully",
      {
        data: settings.supportOps,
      }
    );
  } catch (error) {
    return sendError(
      res,
      500,
      error.message ||
        "Failed to save support and operations settings"
    );
  }
};

module.exports = {
  getCoreAgencySettings,
  saveCoreAgencySettings,

  getPaymentGatewaySettings,
  savePaymentGatewaySettings,

  getAppFirebaseSettings,
  saveAppFirebaseSettings,

  getSupportOpsSettings,
  saveSupportOpsSettings,
};