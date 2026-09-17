const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user/User");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ================= ADMIN SIGNUP =================
// ================= ADMIN SIGNUP =================
exports.adminSignup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      country,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !country) {
      return sendError(
        res,
        400,
        "Full name, email, password and country are required"
      );
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return sendError(
        res,
        409,
        "An account with this email already exists"
      );
    }

    // Create admin
    const admin = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      country: country.trim(),
      password,
      role: "admin",
    });

    // Generate JWT
    const token = generateToken(admin._id, admin.role);

    return sendSuccess(
      res,
      201,
      "Admin registered successfully",
      {
        token,
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          country: admin.country,
          role: admin.role,
        },
      }
    );

  } catch (error) {
    console.error("Admin signup error:", error);

    return sendError(
      res,
      500,
      error.message || "Admin signup failed"
    );
  }
};

// ================= ADMIN LOGIN =================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    const admin = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!admin) {
      return sendError(res, 401, "Invalid email or password");
    }

    if (admin.role !== "admin") {
      return sendError(res, 403, "Access denied. Admin only");
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordMatch) {
      return sendError(res, 401, "Invalid email or password");
    }

    const token = generateToken(admin._id, admin.role);

    return sendSuccess(res, 200, "Admin login successful", {
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        country: admin.country,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return sendError(res, 500, "Something went wrong");
  }
};

// ========================================
// SIGNUP
// ========================================

const signup = async (req, res) => {
  try {
    const {
      fullName,
      identifier,
      country,
      password,
      confirmPassword,
    } = req.body;


    // Validate required fields
    if (
      !fullName ||
      !identifier ||
      !country ||
      !password ||
      !confirmPassword
    ) {
      return sendError(res, 400, "Please fill all required fields");
    }


    // Password confirmation
    if (password !== confirmPassword) {
      return sendError(
        res,
        400,
        "Password and Confirm Password do not match"
      );
    }


    let email = null;
    let phoneNumber = null;


    // Check whether identifier is Email or Phone
    if (identifier.includes("@")) {
      email = identifier.toLowerCase().trim();

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return sendError(
          res,
          409,
          "An account with this email already exists"
        );
      }

    } else {
      phoneNumber = identifier.trim();

      const existingUser = await User.findOne({ phoneNumber });

      if (existingUser) {
        return sendError(
          res,
          409,
          "An account with this phone number already exists"
        );
      }
    }


    // Create user
    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      country,
      password,
      role: "user",
    });


    // Generate JWT Token
    const token = generateToken(user._id);


    return sendSuccess(res, 201, "Account created successfully", {
      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        role: user.role,
      },
    });

  } catch (error) {
    return sendError(
      res,
      500,
      error.message || "Signup failed"
    );
  }
};



// ========================================
// SIGNIN
// ========================================

const signin = async (req, res) => {
  try {
    const { identifier, password } = req.body;


    // Validate
    if (!identifier || !password) {
      return sendError(
        res,
        400,
        "Email/Phone and password are required"
      );
    }


    let user;


    // Email login
    if (identifier.includes("@")) {

      user = await User.findOne({
        email: identifier.toLowerCase().trim(),
      }).select("+password");

    }

    // Phone login
    else {

      user = await User.findOne({
        phoneNumber: identifier.trim(),
      }).select("+password");

    }


    // User check
    if (!user) {
      return sendError(
        res,
        401,
        "Invalid email/phone or password"
      );
    }


    // Password check
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return sendError(
        res,
        401,
        "Invalid email/phone or password"
      );
    }


    // Generate Token
    const token = generateToken(user._id);


    return sendSuccess(res, 200, "Signed in successfully", {
      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        role: user.role,
      },
    });

  } catch (error) {
    return sendError(
      res,
      500,
      error.message || "Signin failed"
    );
  }
};



// ========================================
// GET LOGGED IN USER
// ========================================

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return sendError(res, 404, "User not found");
    }


    return sendSuccess(res, 200, "User profile fetched", {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        role: user.role,
      },
    });

  } catch (error) {
    return sendError(
      res,
      500,
      error.message || "Failed to fetch profile"
    );
  }
};


module.exports = {
  signup,
  signin,
  getMe,
  adminSignup: exports.adminSignup,
  adminLogin: exports.adminLogin,
};