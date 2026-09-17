const Agent = require("../../models/agent/Agent");

// ========================================
// GET ALL AGENTS
// ========================================

const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: agents.length,
      data: agents,
    });
  } catch (error) {
    console.error("Get agents error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE AGENT
// ========================================

const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error("Get agent by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch agent",
      error: error.message,
    });
  }
};

// ========================================
// CREATE AGENT
// ========================================

const createAgent = async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      email,
      identityProof,
      address,
      country,
      state,
      city,
      officeProof,
      havingGST,
      gstDocument,
      gstName,
      companyName,
    } = req.body;

    // Required fields
    if (
      !fullName ||
      !mobileNumber ||
      !email ||
      !address ||
      !country ||
      !state ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, mobile number, email, address, country, state and city are required",
      });
    }

    // Check duplicate email
    const existingEmail = await Agent.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Agent with this email already exists",
      });
    }

    // Check duplicate mobile number
    const existingMobile = await Agent.findOne({
      mobileNumber,
    });

    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: "Agent with this mobile number already exists",
      });
    }

    // ========================================
    // GST LOGIC
    // If GST = false, don't save GST details
    // ========================================

    const gstEnabled =
      havingGST === true || havingGST === "true";

    const agent = await Agent.create({
      fullName,
      mobileNumber,
      email: email.toLowerCase(),

      identityProof: identityProof || null,

      address,
      country,
      state,
      city,

      officeProof: officeProof || null,

      havingGST: gstEnabled,

      gstDocument: gstEnabled
        ? gstDocument || null
        : null,

      gstName: gstEnabled
        ? gstName || null
        : null,

      companyName: gstEnabled
        ? companyName || null
        : null,
    });

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: agent,
    });
  } catch (error) {
    console.error("Create agent error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create agent",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE AGENT
// ========================================

const updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    const {
      fullName,
      mobileNumber,
      email,
      identityProof,
      address,
      country,
      state,
      city,
      officeProof,
      havingGST,
      gstDocument,
      gstName,
      companyName,
    } = req.body;

    // Update personal details
    if (fullName !== undefined) {
      agent.fullName = fullName;
    }

    if (mobileNumber !== undefined) {
      agent.mobileNumber = mobileNumber;
    }

    if (email !== undefined) {
      agent.email = email.toLowerCase();
    }

    if (identityProof !== undefined) {
      agent.identityProof = identityProof;
    }

    // Update communication details
    if (address !== undefined) {
      agent.address = address;
    }

    if (country !== undefined) {
      agent.country = country;
    }

    if (state !== undefined) {
      agent.state = state;
    }

    if (city !== undefined) {
      agent.city = city;
    }

    if (officeProof !== undefined) {
      agent.officeProof = officeProof;
    }

    // ========================================
    // GST UPDATE
    // ========================================

    if (havingGST !== undefined) {
      const gstEnabled =
        havingGST === true || havingGST === "true";

      agent.havingGST = gstEnabled;

      if (gstEnabled) {
        agent.gstDocument =
          gstDocument !== undefined
            ? gstDocument
            : agent.gstDocument;

        agent.gstName =
          gstName !== undefined
            ? gstName
            : agent.gstName;

        agent.companyName =
          companyName !== undefined
            ? companyName
            : agent.companyName;
      } else {
        // GST = No
        agent.gstDocument = null;
        agent.gstName = null;
        agent.companyName = null;
      }
    } else {
      // GST status wasn't changed,
      // but individual GST fields can still be updated
      if (gstDocument !== undefined) {
        agent.gstDocument = gstDocument;
      }

      if (gstName !== undefined) {
        agent.gstName = gstName;
      }

      if (companyName !== undefined) {
        agent.companyName = companyName;
      }
    }

    await agent.save();

    res.status(200).json({
      success: true,
      message: "Agent updated successfully",
      data: agent,
    });
  } catch (error) {
    console.error("Update agent error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update agent",
      error: error.message,
    });
  }
};

// ========================================
// DELETE AGENT
// ========================================

const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    await Agent.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("Delete agent error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete agent",
      error: error.message,
    });
  }
};

module.exports = {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
};