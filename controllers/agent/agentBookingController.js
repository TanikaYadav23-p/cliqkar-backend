const AgentBooking = require("../../models/agent/AgentBooking");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");

// GET /api/agent/bookings/my-bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await AgentBooking.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    return sendSuccess(res, 200, "Bookings fetched successfully", {
      data: bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);
    return sendError(res, 500, error.message || "Failed to fetch bookings");
  }
};

module.exports = { getMyBookings };
