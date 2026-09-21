const crypto = require("crypto");

const OTBApplication = require("../../models/admin/OtbApllication");
const AirlinePrice = require("../../models/admin/AirlinePrice");
const Airline = require("../../models/admin/Airline");
const Country = require("../../models//admin/Country");

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getFileUrl = (req, file) => {
  if (!file) return "";

  const normalizedPath = String(file.path || "").replace(/\\/g, "/");

  const uploadsIndex = normalizedPath.indexOf("uploads/");

  const relativePath =
    uploadsIndex >= 0
      ? normalizedPath.slice(uploadsIndex)
      : `uploads/${file.filename}`;

  return `${req.protocol}://${req.get("host")}/${relativePath.replace(
    /^\/+/,
    ""
  )}`;
};

const documentFromFile = (req, file) => {
  if (!file) return null;

  return {
    originalName: file.originalname || "",
    fileName: file.filename || "",
    url: getFileUrl(req, file),
  };
};

const generateReferenceNumber = () => {
  return (
    "OTB-" +
    String(Date.now()).slice(-8) +
    crypto.randomInt(100, 999)
  );
};

const getUserValue = (user, keys) => {
  for (const key of keys) {
    if (
      user?.[key] !== undefined &&
      user?.[key] !== null
    ) {
      return user[key];
    }
  }

  return "";
};

/* =========================================================
   CREATE OTB APPLICATION - USER SIDE
========================================================= */

exports.createOtbApplication = async (req, res) => {
  try {
    let travelers;

    try {
      travelers = JSON.parse(
        req.body.travelers || "[]"
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid travelers data.",
      });
    }

    if (!Array.isArray(travelers) || travelers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one traveler is required.",
      });
    }

    const countryName = String(
      req.body.goingTo || ""
    ).trim();

    const airlineName = String(
      req.body.airline || ""
    ).trim();

    if (!countryName || !airlineName) {
      return res.status(400).json({
        success: false,
        message: "Country and airline are required.",
      });
    }

    /* -----------------------------------------
       CHECK ACTIVE COUNTRY + AIRLINE
    ----------------------------------------- */

    const [country, airline] = await Promise.all([
      Country.findOne({
        countryName,
        status: "Active",
        allowForOtb: "Yes",
      }).select(
        "_id countryName code status allowForOtb"
      ),

      Airline.findOne({
        name: airlineName,
        status: "Active",
      }).select(
        "_id name code status"
      ),
    ]);

    if (!country) {
      return res.status(400).json({
        success: false,
        message:
          "Selected country is not active for OTB.",
      });
    }

    if (!airline) {
      return res.status(400).json({
        success: false,
        message:
          "Selected airline is not active.",
      });
    }

    /* -----------------------------------------
       GET ADMIN CONFIGURED OTB PRICE
    ----------------------------------------- */

    const priceRule = await AirlinePrice.findOne({
      country: country._id,
      airline: airline._id,
      status: "Active",
    }).select("price status");

    if (!priceRule) {
      return res.status(400).json({
        success: false,
        message:
          "No active OTB price is configured for this country and airline.",
      });
    }

    /* -----------------------------------------
       FILES
    ----------------------------------------- */

    const files = Array.isArray(req.files)
      ? req.files
      : [];

    const getTravelerFile = (
      index,
      field
    ) => {
      return files.find(
        (file) =>
          file.fieldname ===
          `traveler_${index}_${field}`
      );
    };

    /* -----------------------------------------
       NORMALIZE TRAVELERS
    ----------------------------------------- */

    const normalizedTravelers =
      travelers.map((traveler, index) => ({
        fullName: String(
          traveler.fullName || ""
        ).trim(),

        pnr: String(
          traveler.pnr || ""
        )
          .trim()
          .toUpperCase(),

        dob: String(
          traveler.dob || ""
        ).trim(),

        passportFront:
          documentFromFile(
            req,
            getTravelerFile(
              index,
              "passportFront"
            )
          ),

        passportBack:
          documentFromFile(
            req,
            getTravelerFile(
              index,
              "passportBack"
            )
          ),

        visa: documentFromFile(
          req,
          getTravelerFile(
            index,
            "visa"
          )
        ),

        fromTicket:
          documentFromFile(
            req,
            getTravelerFile(
              index,
              "fromTicket"
            )
          ),

        toTicket:
          documentFromFile(
            req,
            getTravelerFile(
              index,
              "toTicket"
            )
          ),
      }));

    for (const traveler of normalizedTravelers) {
      if (
        !traveler.fullName ||
        !traveler.pnr ||
        !traveler.dob
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Traveler name, PNR and DOB are required.",
        });
      }
    }

    /* -----------------------------------------
       USER INFORMATION
    ----------------------------------------- */

    const user = req.user || {};

    const applicantEmail = String(
      req.body.applicantEmail ||
        getUserValue(user, [
          "email",
          "emailAddress",
        ])
    )
      .trim()
      .toLowerCase();

    const applicantPhone = String(
      req.body.applicantPhone ||
        getUserValue(user, [
          "phone",
          "mobile",
          "phoneNumber",
        ])
    ).trim();

    const agentName = String(
      req.body.agentName ||
        getUserValue(user, [
          "name",
          "fullName",
          "username",
        ])
    ).trim();

    /* -----------------------------------------
       CREATE APPLICATION
    ----------------------------------------- */

    const application =
      await OTBApplication.create({
        referenceNumber:
          generateReferenceNumber(),

        goingTo: country._id,

        countryName:
          country.countryName,

        airline: airline._id,

        airlineName:
          airline.name,

        /*
          IMPORTANT:
          Amount is taken from DB,
          not from frontend.
        */

        totalAmount:
          Number(priceRule.price),

        paymentMethod:
          req.body.paymentMethod ||
          "online",

        paymentStatus:
          req.body.paymentMethod ===
          "online"
            ? "Pending"
            : "Not Required",

        status: "Pending",

        workingStatus: "Pending",

        applicantEmail,

        applicantPhone,

        agentName,

        applicantUser:
          user?.id || null,

        travelers:
          normalizedTravelers,

        adminNote: "",
      });

    return res.status(201).json({
      success: true,

      message:
        "OTB application submitted successfully.",

      data: application,
    });
  } catch (error) {
    console.error(
      "Create OTB application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to submit OTB application.",
    });
  }
};

/* =========================================================
   ADMIN - GET APPLICATIONS
========================================================= */

exports.getOtbApplications = async (
  req,
  res
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 15,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    const {
      query = "",
      status = "",
      airline = "",
      date = "",
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (airline) {
      filter.airlineName =
        new RegExp(
          escapeRegex(airline),
          "i"
        );
    }

    if (date) {
      const start = new Date(
        `${date}T00:00:00.000`
      );

      const end = new Date(
        `${date}T23:59:59.999`
      );

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (query.trim()) {
      const q = escapeRegex(
        query.trim()
      );

      filter.$or = [
        {
          applicantEmail:
            new RegExp(q, "i"),
        },

        {
          "travelers.pnr":
            new RegExp(q, "i"),
        },

        {
          "travelers.fullName":
            new RegExp(q, "i"),
        },

        {
          referenceNumber:
            new RegExp(q, "i"),
        },
      ];
    }

    const [
      applications,
      total,
    ] = await Promise.all([
      OTBApplication.find(filter)
        .populate(
          "goingTo",
          "countryName code status"
        )
        .populate(
          "airline",
          "name code status"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      OTBApplication.countDocuments(
        filter
      ),
    ]);

    return res.json({
      success: true,

      data: applications,

      pagination: {
        total,
        page,
        limit,
        totalPages:
          Math.ceil(
            total / limit
          ) || 1,
      },
    });
  } catch (error) {
    console.error(
      "Get OTB applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch OTB applications.",
    });
  }
};

/* =========================================================
   ADMIN - STATS
========================================================= */

exports.getOtbApplicationStats =
  async (req, res) => {
    try {
      const start = new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );

      const end = new Date();

      end.setHours(
        23,
        59,
        59,
        999
      );

      const [
        total,
        pending,
        approved,
        rejected,
        today,
      ] = await Promise.all([
        OTBApplication.countDocuments(),

        OTBApplication.countDocuments({
          status: "Pending",
        }),

        OTBApplication.countDocuments({
          status: "Approved",
        }),

        OTBApplication.countDocuments({
          status: "Rejected",
        }),

        OTBApplication.countDocuments({
          createdAt: {
            $gte: start,
            $lte: end,
          },
        }),
      ]);

      return res.json({
        success: true,

        data: {
          total,
          pending,
          approved,
          rejected,
          today,
        },
      });
    } catch (error) {
      console.error(
        "Get OTB stats error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch OTB statistics.",
      });
    }
  };

/* =========================================================
   ADMIN - GET SINGLE APPLICATION
========================================================= */

exports.getOtbApplicationById =
  async (req, res) => {
    try {
      const application =
        await OTBApplication.findById(
          req.params.id
        )
          .populate(
            "goingTo",
            "countryName code status allowForOtb"
          )
          .populate(
            "airline",
            "name code status"
          )
          .populate(
            "applicantUser",
            "name fullName email phone mobile"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "OTB application not found.",
        });
      }

      return res.json({
        success: true,
        data: application,
      });
    } catch (error) {
      console.error(
        "Get OTB application error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch OTB application.",
      });
    }
  };

/* =========================================================
   ADMIN - UPDATE APPLICATION
========================================================= */

exports.updateOtbApplication =
  async (req, res) => {
    try {
      const {
        status,
        workingStatus,
        paymentStatus,
        adminNote,
      } = req.body;

      const update = {};

      if (status) {
        update.status = status;
        update.statusUpdatedAt =
          new Date();
      }

      if (workingStatus) {
        update.workingStatus =
          workingStatus;
      }

      if (paymentStatus) {
        update.paymentStatus =
          paymentStatus;
      }

      if (
        adminNote !== undefined
      ) {
        update.adminNote =
          adminNote;
      }

      const application =
        await OTBApplication.findByIdAndUpdate(
          req.params.id,
          {
            $set: update,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate(
            "goingTo",
            "countryName code status"
          )
          .populate(
            "airline",
            "name code status"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "OTB application not found.",
        });
      }

      return res.json({
        success: true,

        message:
          "OTB application updated successfully.",

        data: application,
      });
    } catch (error) {
      console.error(
        "Update OTB application error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update OTB application.",
      });
    }
  };

/* =========================================================
   OPTIONAL SEARCH ENDPOINT
========================================================= */

exports.searchOtbApplications =
  async (req, res) => {
    try {
      const {
        query = "",
        status = "",
        airline = "",
        date = "",
      } = req.body || {};

      const filter = {};

      if (status) {
        filter.status = status;
      }

      if (airline) {
        filter.airlineName =
          new RegExp(
            escapeRegex(airline),
            "i"
          );
      }

      if (date) {
        const start = new Date(
          `${date}T00:00:00.000`
        );

        const end = new Date(
          `${date}T23:59:59.999`
        );

        filter.createdAt = {
          $gte: start,
          $lte: end,
        };
      }

      if (query.trim()) {
        const q = escapeRegex(
          query.trim()
        );

        filter.$or = [
          {
            applicantEmail:
              new RegExp(q, "i"),
          },

          {
            referenceNumber:
              new RegExp(q, "i"),
          },

          {
            "travelers.pnr":
              new RegExp(q, "i"),
          },

          {
            "travelers.fullName":
              new RegExp(q, "i"),
          },
        ];
      }

      const applications =
        await OTBApplication.find(
          filter
        )
          .populate(
            "goingTo",
            "countryName code"
          )
          .populate(
            "airline",
            "name code"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        applications,
      });
    } catch (error) {
      console.error(
        "Search OTB applications error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Search failed.",
      });
    }
  };

/* =========================================================
   USER - GET MY OTB APPLICATIONS
========================================================= */

exports.getMyOtbApplications = async (req, res) => {
  try {
    const applications = await OTBApplication.find({
      applicantUser: req.user.id,
    })
      .populate(
        "goingTo",
        "countryName code status"
      )
      .populate(
        "airline",
        "name code status"
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error(
      "Get my OTB applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch your OTB applications.",
    });
  }
};