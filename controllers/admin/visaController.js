const Visa = require("../../models/admin/Visa");

// =====================================================
// ADD VISA
// =====================================================

const addVisa = async (req, res) => {
  try {
    const {
      going_from,
      going_to,
      description,
      about,
      spec,
      entry,
      validity,
      duration,
      documents,
      processing_time,
      amount,
      child_amount,
      absconding_fees,
      status,
    } = req.body;

    // Required fields
    if (
      !going_from ||
      !going_to ||
      !entry ||
      !validity ||
      !duration ||
      !documents ||
      !processing_time ||
      !amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const visa = await Visa.create({
      going_from,
      going_to,
      description,
      about,
      spec,
      entry,
      validity,
      duration,
      documents,
      processing_time,
      amount,
      child_amount: child_amount || "0",
      absconding_fees,
      status: status || "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Visa added successfully",
      visa,
    });
  } catch (error) {
    console.error("Add Visa Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add visa",
      error: error.message,
    });
  }
};


// =====================================================
// GET VISA LIST
// =====================================================

const getVisas = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const search = req.query.search?.trim() || "";
    const going_from = req.query.going_from?.trim() || "";
    const going_to = req.query.going_to?.trim() || "";
    const status = req.query.status?.trim() || "";

    const filter = {};

    // Search by going from / going to / description / about
    if (search) {
      filter.$or = [
        {
          going_from: {
            $regex: search,
            $options: "i",
          },
        },
        {
          going_to: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          about: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Going From filter
    if (going_from) {
      filter.going_from = {
        $regex: going_from,
        $options: "i",
      };
    }

    // Going To filter
    if (going_to) {
      filter.going_to = {
        $regex: going_to,
        $options: "i",
      };
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [visas, total] = await Promise.all([
      Visa.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Visa.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Visa list fetched successfully",

      visas,

      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Get Visa List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch visa list",
      error: error.message,
    });
  }
};


// =====================================================
// GET VISA BY ID
// =====================================================

const getVisaById = async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visa details fetched successfully",
      visa,
    });
  } catch (error) {
    console.error("Get Visa Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch visa details",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE VISA
// =====================================================

const updateVisa = async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa not found",
      });
    }

    const {
      going_from,
      going_to,
      description,
      about,
      spec,
      entry,
      validity,
      duration,
      documents,
      processing_time,
      amount,
      child_amount,
      absconding_fees,
      status,
    } = req.body;

    visa.going_from = going_from ?? visa.going_from;
    visa.going_to = going_to ?? visa.going_to;
    visa.description = description ?? visa.description;
    visa.about = about ?? visa.about;
    visa.spec = spec ?? visa.spec;
    visa.entry = entry ?? visa.entry;
    visa.validity = validity ?? visa.validity;
    visa.duration = duration ?? visa.duration;
    visa.documents = documents ?? visa.documents;
    visa.processing_time =
      processing_time ?? visa.processing_time;
    visa.amount = amount ?? visa.amount;
    visa.child_amount =
      child_amount ?? visa.child_amount;
    visa.absconding_fees =
      absconding_fees ?? visa.absconding_fees;
    visa.status = status ?? visa.status;

    await visa.save();

    return res.status(200).json({
      success: true,
      message: "Visa updated successfully",
      visa,
    });
  } catch (error) {
    console.error("Update Visa Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update visa",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE VISA
// =====================================================

const deleteVisa = async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa not found",
      });
    }

    await Visa.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Visa deleted successfully",
    });
  } catch (error) {
    console.error("Delete Visa Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete visa",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE VISA STATUS
// =====================================================

const updateVisaStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Deactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visa status",
      });
    }

    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa not found",
      });
    }

    visa.status = status;

    await visa.save();

    return res.status(200).json({
      success: true,
      message: `Visa ${status} successfully`,
      visa,
    });
  } catch (error) {
    console.error("Update Visa Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update visa status",
      error: error.message,
    });
  }
};


module.exports = {
  addVisa,
  getVisas,
  getVisaById,
  updateVisa,
  deleteVisa,
  updateVisaStatus,
};