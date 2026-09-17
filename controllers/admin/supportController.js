const mongoose = require("mongoose");
const Ticket = require("../../models/admin/Ticket");


// =====================================================
// GET ALL SUPPORT TICKETS
// GET /api/admin/support-tickets
// =====================================================

const getAllTickets = async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Status filter
    if (status !== "All") {
      query.status = status;
    }

    // Search
    if (search.trim()) {
      query.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          mobileNumber: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          ticketId: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          subject: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);

    const skip = (pageNumber - 1) * limitNumber;

    const [tickets, total, pendingCount] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Ticket.countDocuments(query),

      Ticket.countDocuments({
        status: "Pending",
      }),
    ]);

    const formattedTickets = tickets.map((ticket) => ({
      id: ticket._id,
      supportId: ticket.ticketId,
      name: ticket.name,
      email: ticket.email,
      mobileNumber: ticket.mobileNumber,
      subject: ticket.subject,
      description: ticket.message,
      status: ticket.status,
      createdAt: ticket.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Support tickets fetched successfully",
      data: {
        tickets: formattedTickets,
        total,
        pendingCount,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get Support Tickets Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch support tickets",
    });
  }
};


// =====================================================
// GET SINGLE SUPPORT TICKET
// GET /api/admin/support-tickets/:id
// =====================================================

const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid support ticket ID",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support ticket fetched successfully",
      data: {
        id: ticket._id,
        supportId: ticket.ticketId,
        name: ticket.name,
        email: ticket.email,
        mobileNumber: ticket.mobileNumber,
        subject: ticket.subject,
        description: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch support ticket",
    });
  }
};


// =====================================================
// UPDATE SUPPORT TICKET STATUS
// PATCH /api/admin/support-tickets/:id
// =====================================================

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid support ticket ID",
      });
    }

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be Pending, In Progress or Resolved",
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support ticket status updated successfully",
      data: {
        id: ticket._id,
        supportId: ticket.ticketId,
        name: ticket.name,
        email: ticket.email,
        mobileNumber: ticket.mobileNumber,
        subject: ticket.subject,
        description: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Ticket Status Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update ticket status",
    });
  }
};


module.exports = {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
};