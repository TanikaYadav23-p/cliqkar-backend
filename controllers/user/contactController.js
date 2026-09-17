const Ticket = require("../../models/admin/Ticket");

const createContactTicket = async (req, res) => {
  try {
    const {
      name,
      email,
      mobileNumber,
      subject,
      message,
    } = req.body;

    if (!name || !email || !mobileNumber || !subject || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, mobile number, subject and message are required",
      });
    }

    const ticket = await Ticket.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobileNumber: mobileNumber.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Your message has been submitted successfully. Our support team will contact you shortly.",
      data: {
        ticketId: ticket.ticketId,
      },
    });
  } catch (error) {
    console.error("Create Contact Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit contact form",
    });
  }
};

module.exports = {
  createContactTicket,
};