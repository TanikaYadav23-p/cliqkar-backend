const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/user/User");
const Agent = require("../../models/agent/Agent");

const {
  sendSuccess,
  sendError,
} = require("../../helpers/apiResponse");

// ========================================
// GENERATE TOKEN
// ========================================

const generateToken = (id, role) => {
  return jwt.sign(
    {
      id,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ========================================
// AGENT SIGNUP
// ========================================

const agentSignup = async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      email,
      password,
      confirmPassword,

      identityProofType,

      address,
      country,
      state,
      city,

      havingGST,
      gstName,
      companyName,
    } = req.body;

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (
      !fullName ||
      !mobileNumber ||
      !email ||
      !password ||
      !confirmPassword ||
      !address ||
      !country ||
      !state ||
      !city
    ) {
      return sendError(
        res,
        400,
        "Please fill all required fields"
      );
    }

    // ========================================
    // PASSWORD VALIDATION
    // ========================================

    if (password !== confirmPassword) {
      return sendError(
        res,
        400,
        "Password and Confirm Password do not match"
      );
    }

    if (password.length < 6) {
      return sendError(
        res,
        400,
        "Password must be at least 6 characters"
      );
    }

    // ========================================
    // NORMALIZE
    // ========================================

    const normalizedEmail =
      email.toLowerCase().trim();

    const normalizedMobile =
      mobileNumber.trim();

    // ========================================
    // CHECK EMAIL
    // ========================================

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return sendError(
        res,
        409,
        "An account with this email already exists"
      );
    }

    // ========================================
    // CHECK MOBILE
    // ========================================

    const existingMobile =
      await User.findOne({
        phoneNumber: normalizedMobile,
      });

    if (existingMobile) {
      return sendError(
        res,
        409,
        "An account with this mobile number already exists"
      );
    }

    // ========================================
    // IDENTITY PROOF
    // ========================================

    let identityProof = {
      proofType: identityProofType || null,
      documentUrl: null,
      documentName: null,
    };

    if (req.files?.identityProof?.[0]) {
      const file =
        req.files.identityProof[0];

      identityProof.documentUrl =
        `/uploads/agents/${file.filename}`;

      identityProof.documentName =
        file.originalname;
    }

    // ========================================
    // OFFICE PROOF
    // ========================================

    let officeProof = {
      documentUrl: null,
      documentName: null,
    };

    if (req.files?.officeProof?.[0]) {
      const file =
        req.files.officeProof[0];

      officeProof.documentUrl =
        `/uploads/agents/${file.filename}`;

      officeProof.documentName =
        file.originalname;
    }

    // ========================================
    // GST DOCUMENT
    // ========================================

    let gstDocument = {
      documentUrl: null,
      documentName: null,
    };

    const isGST =
      havingGST === true ||
      havingGST === "true";

    if (
      isGST &&
      req.files?.gstDocument?.[0]
    ) {
      const file =
        req.files.gstDocument[0];

      gstDocument.documentUrl =
        `/uploads/agents/${file.filename}`;

      gstDocument.documentName =
        file.originalname;
    }

    // ========================================
    // CREATE USER ACCOUNT
    // ========================================

    const user = await User.create({
      fullName: fullName.trim(),

      email: normalizedEmail,

      phoneNumber: normalizedMobile,

      country: country.trim(),

      password,

      role: "agent",
    });

    // ========================================
    // CREATE AGENT PROFILE
    // ========================================

    const agent = await Agent.create({
      user: user._id,

      fullName: fullName.trim(),

      mobileNumber: normalizedMobile,

      email: normalizedEmail,

      identityProof,

      address: address.trim(),

      country: country.trim(),

      state: state.trim(),

      city: city.trim(),

      officeProof,

      havingGST: isGST,

      gstDocument,

      gstName: isGST
        ? gstName?.trim() || null
        : null,

      companyName: isGST
        ? companyName?.trim() || null
        : null,
    });

    // ========================================
    // TOKEN
    // ========================================

    const token = generateToken(
      user._id,
      user.role
    );

    // ========================================
    // RESPONSE
    // ========================================

    return sendSuccess(
      res,
      201,
      "Agent account created successfully",
      {
        token,

        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          country: user.country,
          role: user.role,
        },

        agent: {
          id: agent._id,
          fullName: agent.fullName,
          mobileNumber: agent.mobileNumber,
          email: agent.email,
          country: agent.country,
          state: agent.state,
          city: agent.city,
          havingGST: agent.havingGST,
        },
      }
    );
  } catch (error) {
    console.error(
      "Agent signup error:",
      error
    );

    return sendError(
      res,
      500,
      error.message ||
        "Agent signup failed"
    );
  }
};

// ========================================
// AGENT SIGNIN
// ========================================

const agentSignin = async (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body;

    if (!identifier || !password) {
      return sendError(
        res,
        400,
        "Email/mobile and password are required"
      );
    }

    const value =
      identifier.trim();

    let user;

    // ========================================
    // EMAIL LOGIN
    // ========================================

    if (value.includes("@")) {
      user = await User.findOne({
        email: value.toLowerCase(),
      }).select("+password");
    }

    // ========================================
    // MOBILE LOGIN
    // ========================================

    else {
      user = await User.findOne({
        phoneNumber: value,
      }).select("+password");
    }

    // ========================================
    // CHECK USER
    // ========================================

    if (!user) {
      return sendError(
        res,
        401,
        "Invalid email/mobile or password"
      );
    }

    // ========================================
    // AGENT CHECK
    // ========================================

    if (user.role !== "agent") {
      return sendError(
        res,
        403,
        "Access denied. Agent account required"
      );
    }

    // ========================================
    // PASSWORD
    // ========================================

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return sendError(
        res,
        401,
        "Invalid email/mobile or password"
      );
    }

    // ========================================
    // TOKEN
    // ========================================

    const token =
      generateToken(
        user._id,
        user.role
      );

    // ========================================
    // RESPONSE
    // ========================================

    return sendSuccess(
      res,
      200,
      "Agent signed in successfully",
      {
        token,

        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber:
            user.phoneNumber,
          country: user.country,
          role: user.role,
        },
      }
    );
  } catch (error) {
    console.error(
      "Agent signin error:",
      error
    );

    return sendError(
      res,
      500,
      error.message ||
        "Agent signin failed"
    );
  }
};

module.exports = {
  agentSignup,
  agentSignin,
};