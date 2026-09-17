const Airport = require("../../models/admin/airport");
const { sendError } = require("../../helpers/apiResponse");

// ===============================
// ADD AIRPORT
// ===============================
const addAirport = async (req, res) => {
  try {
    const {
      airportName,
      airportCode,
      countryName,
      countryCode,
      cityName,
      latitude,
      longitude,
      status,
    } = req.body;

    if (!airportName || !airportCode || !countryName || !cityName) {
      return sendError(
        res,
        400,
        "Airport name, airport code, country name and city name are required"
      );
    }

    const existingAirport = await Airport.findOne({
      airportCode: airportCode.trim().toUpperCase(),
    });

    if (existingAirport) {
      return sendError(res, 400, "Airport code already exists");
    }

    const airport = await Airport.create({
      airportName: airportName.trim(),
      airportCode: airportCode.trim().toUpperCase(),
      countryName: countryName.trim(),
      countryCode: countryCode?.trim().toUpperCase(),
      cityName: cityName.trim(),
      latitude: latitude?.trim(),
      longitude: longitude?.trim(),
      status: status || "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Airport added successfully",
      data: airport,
    });
  } catch (error) {
    console.error("Add Airport Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to add airport"
    );
  }
};


// ===============================
// GET AIRPORT LIST
// ===============================
const getAirports = async (req, res) => {
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
          airportName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          airportCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          cityName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          countryName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const total = await Airport.countDocuments(filter);

    const airports = await Airport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Airport list retrieved successfully",
      data: airports,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Get Airports Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to retrieve airports"
    );
  }
};


// ===============================
// GET SINGLE AIRPORT
// ===============================
const getAirportById = async (req, res) => {
  try {
    const airport = await Airport.findById(req.params.id);

    if (!airport) {
      return sendError(res, 404, "Airport not found");
    }

    return res.status(200).json({
      success: true,
      message: "Airport retrieved successfully",
      data: airport,
    });
  } catch (error) {
    console.error("Get Airport Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to retrieve airport"
    );
  }
};


// ===============================
// UPDATE AIRPORT
// ===============================
const updateAirport = async (req, res) => {
  try {
    const {
      airportName,
      airportCode,
      countryName,
      countryCode,
      cityName,
      latitude,
      longitude,
      status,
    } = req.body;

    const airport = await Airport.findById(req.params.id);

    if (!airport) {
      return sendError(res, 404, "Airport not found");
    }

    if (airportCode) {
      const existingAirport = await Airport.findOne({
        airportCode: airportCode.trim().toUpperCase(),
        _id: { $ne: req.params.id },
      });

      if (existingAirport) {
        return sendError(res, 400, "Airport code already exists");
      }
    }

    airport.airportName = airportName?.trim() ?? airport.airportName;
    airport.airportCode =
      airportCode?.trim().toUpperCase() ?? airport.airportCode;
    airport.countryName =
      countryName?.trim() ?? airport.countryName;
    airport.countryCode =
      countryCode?.trim().toUpperCase() ?? airport.countryCode;
    airport.cityName =
      cityName?.trim() ?? airport.cityName;
    airport.latitude =
      latitude?.trim() ?? airport.latitude;
    airport.longitude =
      longitude?.trim() ?? airport.longitude;
    airport.status = status ?? airport.status;

    await airport.save();

    return res.status(200).json({
      success: true,
      message: "Airport updated successfully",
      data: airport,
    });
  } catch (error) {
    console.error("Update Airport Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update airport"
    );
  }
};


// ===============================
// DELETE AIRPORT
// ===============================
const deleteAirport = async (req, res) => {
  try {
    const airport = await Airport.findById(req.params.id);

    if (!airport) {
      return sendError(res, 404, "Airport not found");
    }

    await Airport.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Airport deleted successfully",
    });
  } catch (error) {
    console.error("Delete Airport Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to delete airport"
    );
  }
};


// ===============================
// UPDATE AIRPORT STATUS
// ===============================
const updateAirportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Deactive"].includes(status)) {
      return sendError(res, 400, "Invalid status");
    }

    const airport = await Airport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!airport) {
      return sendError(res, 404, "Airport not found");
    }

    return res.status(200).json({
      success: true,
      message: "Airport status updated successfully",
      data: airport,
    });
  } catch (error) {
    console.error("Update Airport Status Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update airport status"
    );
  }
};


module.exports = {
  addAirport,
  getAirports,
  getAirportById,
  updateAirport,
  deleteAirport,
  updateAirportStatus,
};