const Agent = require("../../models/agent/Agent");
const User = require("../../models/user/User");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");

// =====================================================
// GET CURRENT LOGGED-IN AGENT'S PROFILE
// (Personal + Communication + Identity/Office/GST docs
//  — sab wahi data jo signup ke waqt bhara gaya tha)
// =====================================================

const getMyAgentProfile = async (req, res) => {
  try {
    const agent = await Agent.findOne({ user: req.user.id });

    if (!agent) {
      return sendError(res, 404, "Agent profile not found");
    }

    return sendSuccess(res, 200, "Agent profile fetched successfully", {
      agent,
    });
  } catch (error) {
    console.error("Get agent profile error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch agent profile"
    );
  }
};

// =====================================================
// UPDATE PERSONAL + COMMUNICATION DETAILS
// (identity/office/GST documents yahan edit nahi hote —
//  wo signup ke document hi rehte hain)
// =====================================================

const updateMyAgentProfile = async (req, res) => {
  try {
    const agent = await Agent.findOne({ user: req.user.id });

    if (!agent) {
      return sendError(res, 404, "Agent profile not found");
    }

    const { fullName, mobileNumber, address, country, state, city } =
      req.body;

    if (fullName !== undefined) agent.fullName = fullName.trim();
    if (mobileNumber !== undefined) agent.mobileNumber = mobileNumber.trim();
    if (address !== undefined) agent.address = address.trim();
    if (country !== undefined) agent.country = country.trim();
    if (state !== undefined) agent.state = state.trim();
    if (city !== undefined) agent.city = city.trim();

    await agent.save();

    // Linked login account (User) ko bhi sync rakhte hain,
    // taaki naam/mobile/address dono jagah ek jaisa dikhe.
    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(mobileNumber !== undefined && {
          phoneNumber: mobileNumber.trim(),
        }),
        ...(address !== undefined && { address: address.trim() }),
        ...(country !== undefined && { country: country.trim() }),
      },
    });

    return sendSuccess(res, 200, "Profile updated successfully", { agent });
  } catch (error) {
    console.error("Update agent profile error:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "This mobile number is already linked to another account"
      );
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return sendError(res, 400, message);
    }

    return sendError(
      res,
      500,
      error.message || "Failed to update agent profile"
    );
  }
};

module.exports = {
  getMyAgentProfile,
  updateMyAgentProfile,
};
