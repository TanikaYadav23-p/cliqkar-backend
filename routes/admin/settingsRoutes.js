const express = require("express");


const {
  getCoreAgencySettings,
  saveCoreAgencySettings,

  getPaymentGatewaySettings,
  savePaymentGatewaySettings,

  getAppFirebaseSettings,
  saveAppFirebaseSettings,

  getSupportOpsSettings,
  saveSupportOpsSettings,
} = require("../../controllers/admin/settingsController");

const router = express.Router();

// Every settings API requires logged-in admin


// Core Agency
router.get(
  "/core-agency",
  getCoreAgencySettings
);

router.post(
  "/core-agency",
  saveCoreAgencySettings
);

// Easebuzz
router.get(
  "/payment-gateway",
  getPaymentGatewaySettings
);

router.post(
  "/payment-gateway",
  savePaymentGatewaySettings
);

// App & Firebase
router.get(
  "/app-firebase",
  getAppFirebaseSettings
);

router.post(
  "/app-firebase",
  saveAppFirebaseSettings
);

// Support & Operations
router.get(
  "/support-ops",
  getSupportOpsSettings
);

router.post(
  "/support-ops",
  saveSupportOpsSettings
);

module.exports = router;