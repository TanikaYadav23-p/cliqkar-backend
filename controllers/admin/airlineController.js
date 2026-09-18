const Airline = require("../../models/admin/Airline");
const AirlinePrice = require("../../models/admin/AirlinePrice");
const { sendError } = require("../../helpers/apiResponse");


// ======================================
// ADD AIRLINE
// ======================================
// ======================================
// GET ACTIVE OTB PRICES FOR APPLICATION
// ======================================

const getActiveOtbPrices = async (req, res) => {
  try {
    const prices = await AirlinePrice.find({
      status: "Active",
    })
      .populate("airline", "name code status")
      .populate("country", "countryName code status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Active OTB prices fetched successfully",
      data: prices,
    });
  } catch (error) {
    console.error("Get Active OTB Prices Error:", error);

    return sendError(
      res,
      500,
      error.message || "Error fetching active OTB prices"
    );
  }
};
const addAirline = async (req, res) => {
  try {
    const {
      name,
      code,
      status,
    } = req.body;

    if (!name || !code) {
      return sendError(
        res,
        400,
        "Airline name and code are required"
      );
    }

    const existingAirline = await Airline.findOne({
      $or: [
        { code: code.trim().toUpperCase() },
        { name: name.trim() },
      ],
    });

    if (existingAirline) {
      return sendError(
        res,
        400,
        "Airline with this name or code already exists"
      );
    }

    let logo = "";

    // If frontend sends logo as uploaded file
    if (req.file) {
        logo = `/uploads/airlines/${req.file.filename}`;
      } else if (typeof req.body.logo === "string") {
        logo = req.body.logo;
      }

    const airline = await Airline.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      logo,
      status: status || "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Airline added successfully",
      data: airline,
    });
  } catch (error) {
    console.error("Add Airline Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to add airline"
    );
  }
};


// ======================================
// GET AIRLINE LIST
// ======================================
const getAirlines = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const search = req.query.search?.trim() || "";
    const status = req.query.status?.trim() || "";

    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          code: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const total = await Airline.countDocuments(filter);

    const airlines = await Airline.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Airline list retrieved successfully",
      data: airlines,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Get Airlines Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to retrieve airlines"
    );
  }
};


// ======================================
// GET SINGLE AIRLINE
// ======================================
const getAirlineById = async (req, res) => {
  try {
    const airline = await Airline.findById(req.params.id);

    if (!airline) {
      return sendError(res, 404, "Airline not found");
    }

    return res.status(200).json({
      success: true,
      message: "Airline retrieved successfully",
      data: airline,
    });
  } catch (error) {
    console.error("Get Airline Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to retrieve airline"
    );
  }
};


// ======================================
// UPDATE AIRLINE
// ======================================
const updateAirline = async (req, res) => {
  try {
    const airline = await Airline.findById(req.params.id);

    if (!airline) {
      return sendError(res, 404, "Airline not found");
    }

    if (req.body.code) {
      const existingAirline = await Airline.findOne({
        code: req.body.code.trim().toUpperCase(),
        _id: { $ne: req.params.id },
      });

      if (existingAirline) {
        return sendError(res, 400, "Airline code already exists");
      }
    }

    if (req.body.name) {
      airline.name = req.body.name.trim();
    }

    if (req.body.code) {
      airline.code = req.body.code.trim().toUpperCase();
    }

    if (req.body.status) {
      airline.status = req.body.status;
    }

    if (req.file) {
        airline.logo = `/uploads/airlines/${req.file.filename}`;
      } else if (typeof req.body.logo === "string") {
        airline.logo = req.body.logo;
      }

    await airline.save();

    return res.status(200).json({
      success: true,
      message: "Airline updated successfully",
      data: airline,
    });
  } catch (error) {
    console.error("Update Airline Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update airline"
    );
  }
};


// ======================================
// DELETE AIRLINE
// ======================================
const deleteAirline = async (req, res) => {
  try {
    const airline = await Airline.findById(req.params.id);

    if (!airline) {
      return sendError(res, 404, "Airline not found");
    }

    await Airline.findByIdAndDelete(req.params.id);

    // Delete related airline prices
    await AirlinePrice.deleteMany({
      airline: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Airline deleted successfully",
    });
  } catch (error) {
    console.error("Delete Airline Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to delete airline"
    );
  }
};


// ======================================
// UPDATE AIRLINE STATUS
// ======================================
const updateAirlineStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Deactive"].includes(status)) {
      return sendError(res, 400, "Invalid status");
    }

    const airline = await Airline.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!airline) {
      return sendError(res, 404, "Airline not found");
    }

    return res.status(200).json({
      success: true,
      message: "Airline status updated successfully",
      data: airline,
    });
  } catch (error) {
    console.error("Update Airline Status Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update airline status"
    );
  }
};


// ======================================
// CREATE / UPDATE AIRLINE PRICE
// ======================================
const createOrUpdateAirlinePrice = async (req, res) => {
  try {
    const {
      airlineId,
      countryId,
      price,
      status,
    } = req.body;

    if (!airlineId || !countryId || price === undefined) {
      return sendError(
        res,
        400,
        "Airline, country and price are required"
      );
    }

    const airline = await Airline.findById(airlineId);

    if (!airline) {
      return sendError(res, 404, "Airline not found");
    }

    let airlinePrice = await AirlinePrice.findOne({
      airline: airlineId,
      country: countryId,
    });

    if (airlinePrice) {
      airlinePrice.price = price;
      airlinePrice.status = status || airlinePrice.status;

      await airlinePrice.save();

      await airlinePrice.populate([
        {
          path: "airline",
          select: "name code",
        },
        {
          path: "country",
          select: "countryName code",
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Airline price updated successfully",
        data: airlinePrice,
      });
    }

    airlinePrice = await AirlinePrice.create({
      airline: airlineId,
      country: countryId,
      price,
      status: status || "Active",
    });

    await airlinePrice.populate([
      {
        path: "airline",
        select: "name code",
      },
      {
        path: "country",
        select: "countryName code",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Airline price created successfully",
      data: airlinePrice,
    });
  } catch (error) {
    console.error("Airline Price Error:", error);

    return sendError(
      res,
      500,
      error.message || "Error creating or updating airline price"
    );
  }
};


// ======================================
// GET AIRLINE PRICES
// ======================================
const getAirlinePrices = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const {
      airlineId,
      countryId,
      isAdmin = "no",
    } = req.query;

    const filter = {};

    if (airlineId) {
      filter.airline = airlineId;
    }

    if (countryId) {
      filter.country = countryId;
    }

    if (isAdmin !== "yes") {
      filter.status = "Active";
    }

    const skip = (page - 1) * limit;

    const total = await AirlinePrice.countDocuments(filter);

    const prices = await AirlinePrice.find(filter)
      .populate("airline", "name code")
      .populate("country", "countryName code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Airline prices fetched successfully",
      data: prices,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Get Airline Prices Error:", error);

    return sendError(
      res,
      500,
      error.message || "Error fetching airline prices"
    );
  }
};


// ======================================
// GET AIRLINE PRICE BY COUNTRY
// ======================================
const getAirlinePrice = async (req, res) => {
  try {
    const { countryId, airlineId } = req.query;

    const filter = {};

    if (countryId) {
      filter.country = countryId;
    }

    if (airlineId) {
      filter.airline = airlineId;
    }

    const data = await AirlinePrice.findOne(filter)
      .populate("airline", "name code")
      .populate("country", "countryName code");

    return res.status(200).json({
      success: true,
      message: "Airline price fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get Airline Price Error:", error);

    return sendError(
      res,
      500,
      error.message || "Error fetching airline price"
    );
  }
};


module.exports = {
  getActiveOtbPrices,
  addAirline,
  getAirlines,
  getAirlineById,
  updateAirline,
  deleteAirline,
  updateAirlineStatus,
  createOrUpdateAirlinePrice,
  getAirlinePrices,
  getAirlinePrice,
};