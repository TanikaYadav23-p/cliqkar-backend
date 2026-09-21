const User = require("../../models/user/User");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");


// =====================================================
// GET CURRENT LOGGED-IN USER PROFILE
// =====================================================

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "Profile fetched successfully", {
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch profile"
    );
  }
};


// =====================================================
// UPDATE CURRENT USER PERSONAL DETAILS
// =====================================================

const updatePersonalProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    const {
      fullName,
      email,
      mobile,
      nationality,
      dob,
      gender,
      address,
    } = req.body;


    // Full Name
    if (fullName !== undefined) {
      user.fullName = fullName;
    }


    // Email
    if (email !== undefined) {
      user.email = email;
    }


    // Mobile -> phoneNumber
    if (mobile !== undefined) {
      user.phoneNumber = mobile;
    }


    // Nationality -> country
    if (nationality !== undefined) {
      user.country = nationality;
    }


    // Date of Birth
    if (dob !== undefined) {
      user.dob = dob;
    }


    // Gender
    if (gender !== undefined) {
      user.gender = gender;
    }


    // Address
    if (address !== undefined) {
      user.address = address;
    }


    await user.save();


    const updatedUser = await User.findById(req.user.id)
      .select("-password");


    return sendSuccess(
      res,
      200,
      "Profile updated successfully",
      {
        user: updatedUser,
      }
    );
  } catch (error) {
    console.error("Update profile error:", error);


    if (error.code === 11000) {
      return sendError(
        res,
        400,
        "Email or phone number already exists"
      );
    }


    return sendError(
      res,
      500,
      error.message || "Failed to update profile"
    );
  }
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

const updatePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;


    if (!currentPassword || !newPassword) {
      return sendError(
        res,
        400,
        "Current password and new password are required"
      );
    }


    if (newPassword.length < 6) {
      return sendError(
        res,
        400,
        "New password must be at least 6 characters"
      );
    }


    // Password has select:false
    // So explicitly select it
    const user = await User.findById(req.user.id)
      .select("+password");


    if (!user) {
      return sendError(res, 404, "User not found");
    }


    const isMatch = await user.matchPassword(
      currentPassword
    );


    if (!isMatch) {
      return sendError(
        res,
        400,
        "Current password is incorrect"
      );
    }


    user.password = newPassword;

    await user.save();


    return sendSuccess(
      res,
      200,
      "Password changed successfully"
    );
  } catch (error) {
    console.error("Update password error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update password"
    );
  }
};


module.exports = {
  getMyProfile,
  updatePersonalProfile,
  updatePassword,
};