const Country = require("../../models/admin/Country");
const { sendError } = require("../../helpers/apiResponse");

// ===============================
// ADD COUNTRY
// ===============================
const addCountry = async (req, res) => {
  try {
    const {
      countryName,
      code,
      currency,
    } = req.body;

    if (!countryName || !code || !currency) {
      return sendError(
        res,
        400,
        "Country name, code and currency are required"
      );
    }

    const existingCountry = await Country.findOne({
      $or: [
        { code: code.trim().toUpperCase() },
        { countryName: countryName.trim() },
      ],
    });

    if (existingCountry) {
      return sendError(
        res,
        400,
        "Country with this name or code already exists"
      );
    }

    const country = await Country.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Country added successfully",
      data: country,
    });
  } catch (error) {
    console.error("Add Country Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to add country"
    );
  }
};


// ===============================
// GET COUNTRY LIST
// ===============================
// ===============================
// GET COUNTRY LIST
// ===============================
const getCountries = async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  
      const search = req.query.search?.trim() || "";
      const status = req.query.status?.trim() || "";
      const visaStatus = req.query.visaStatus?.trim() || "";
      const otbStatus = req.query.otbStatus?.trim() || "";
  
      const skip = (page - 1) * limit;
  
      const filter = {};
  
      // Search country / code / currency
      if (search) {
        filter.$or = [
          {
            countryName: {
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
          {
            currency: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }
  
      // Status filter
      if (status) {
        filter.status = status;
      }
  
      // Visa filter
      if (visaStatus) {
        filter.allowForVisa = visaStatus;
      }
  
      // OTB filter
      if (otbStatus) {
        filter.allowForOtb = otbStatus;
      }
  
      const total = await Country.countDocuments(filter);
  
      const countries = await Country.find(filter)
        .sort({ countryName: 1 })
        .skip(skip)
        .limit(limit);
  
      return res.status(200).json({
        success: true,
        message: "Country list retrieved successfully",
        data: countries,
        pagination: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          pageSize: limit,
        },
      });
    } catch (error) {
      console.error("Get Countries Error:", error);
  
      return sendError(
        res,
        500,
        error.message || "Failed to retrieve countries"
      );
    }
  };


// ===============================
// GET SINGLE COUNTRY
// ===============================
const getCountryById = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);

    if (!country) {
      return sendError(res, 404, "Country not found");
    }

    return res.status(200).json({
      success: true,
      message: "Country retrieved successfully",
      data: country,
    });
  } catch (error) {
    console.error("Get Country Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to retrieve country"
    );
  }
};


// ===============================
// UPDATE COUNTRY
// ===============================
// ===============================
// UPDATE COUNTRY
// ===============================
const updateCountry = async (req, res) => {
    try {
      const country = await Country.findById(req.params.id);
  
      if (!country) {
        return sendError(res, 404, "Country not found");
      }
  
      const updateData = {
        ...req.body,
      };
  
      if (updateData.code) {
        updateData.code = updateData.code.trim().toUpperCase();
  
        const existingCountry = await Country.findOne({
          code: updateData.code,
          _id: { $ne: req.params.id },
        });
  
        if (existingCountry) {
          return sendError(res, 400, "Country code already exists");
        }
      }
  
      if (updateData.countryName) {
        updateData.countryName = updateData.countryName.trim();
  
        const existingCountry = await Country.findOne({
          countryName: updateData.countryName,
          _id: { $ne: req.params.id },
        });
  
        if (existingCountry) {
          return sendError(
            res,
            400,
            "Country with this name already exists"
          );
        }
      }
  
      Object.assign(country, updateData);
  
      await country.save();
  
      return res.status(200).json({
        success: true,
        message: "Country updated successfully",
        data: country,
      });
    } catch (error) {
      console.error("Update Country Error:", error);
  
      return sendError(
        res,
        500,
        error.message || "Failed to update country"
      );
    }
  };


// ===============================
// DELETE COUNTRY
// ===============================
const deleteCountry = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);

    if (!country) {
      return sendError(res, 404, "Country not found");
    }

    await Country.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    console.error("Delete Country Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to delete country"
    );
  }
};


// ===============================
// UPDATE COUNTRY STATUS
// ===============================
const updateCountryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Deactive"].includes(status)) {
      return sendError(res, 400, "Invalid status");
    }

    const country = await Country.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!country) {
      return sendError(res, 404, "Country not found");
    }

    return res.status(200).json({
      success: true,
      message: "Country status updated successfully",
      data: country,
    });
  } catch (error) {
    console.error("Update Country Status Error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update country status"
    );
  }
};



module.exports = {
  addCountry,
  getCountries,
  getCountryById,
  updateCountry,
  deleteCountry,
  updateCountryStatus,
};