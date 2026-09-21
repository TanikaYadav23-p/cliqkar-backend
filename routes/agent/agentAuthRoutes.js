const express = require("express");

const router =
  express.Router();

const {
  agentSignup,
  agentSignin,
} = require("../../controllers/agent/agentAuthController");

const agentUpload =
  require("../../helpers/agentUploads");

// ========================================
// AGENT SIGNUP
// ========================================

router.post(
  "/signup",

  agentUpload.fields([
    {
      name: "identityProof",
      maxCount: 1,
    },

    {
      name: "officeProof",
      maxCount: 1,
    },

    {
      name: "gstDocument",
      maxCount: 1,
    },
  ]),

  agentSignup
);

// ========================================
// AGENT SIGNIN
// ========================================

router.post(
  "/signin",
  agentSignin
);

module.exports = router;