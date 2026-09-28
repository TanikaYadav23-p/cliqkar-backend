const AgentVisaApplication = require("../../models/agent/AgentVisaApplication");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");

// GET /api/agent/visa/my-applications
const getMyVisaApplications = async (req, res) => {
  try {
    const applications = await AgentVisaApplication.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Visa applications fetched successfully", {
      data: applications,
    });
  } catch (error) {
    console.error("Get my visa applications error:", error);
    return sendError(
      res,
      500,
      error.message || "Failed to fetch visa applications"
    );
  }
};

module.exports = { getMyVisaApplications };
