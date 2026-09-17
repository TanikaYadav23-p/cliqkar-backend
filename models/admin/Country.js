const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    countryName: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    currency: {
      type: String,
      required: true,
      trim: true,
    },

    // Visa
    allowForVisa: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // OTB
    allowForOtb: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Passport Front
    allowForPassportFront: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPassportFrontRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Passport Back
    allowForPassportBack: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPassportBackRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // PAN Card
    allowForPanCard: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPanCardRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPanCardNumber: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPanCardNumberRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Passport Number
    allowForPassportNumber: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPassportNumberRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Passenger Details
    allowForFirstName: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForFirstNameRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForLastName: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForLastNameRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForNationality: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForNationalityRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Check-in / Check-out
    allowForCheckinPoint: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForCheckinPointRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForCheckoutPoint: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForCheckoutPointRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Additional Folder
    allowForAdditionalFolder: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForAdditionalFolderRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForAdditionalFolderLabel: {
      type: String,
      default: "",
      trim: true,
    },

    // Insurance
    allowForInsurance: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForInsuranceRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Occupation
    allowForOccupation: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForOccupationRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Photo
    allowForPhoto: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPhotoRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Hotel
    allowForHotelName: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForHotelNameRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForHotelVoucher: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForHotelVoucherRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Travel Date
    allowForTravelDate: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForTravelDateRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Gender
    allowForGender: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForGenderRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // DOB
    allowForDob: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForDobRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Mother Name
    allowForMotherName: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForMotherNameRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Father Name
    allowForFatherName: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForFatherNameRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Place of Birth
    allowForPlaceOfBirth: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForPlaceOfBirthRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // Spouse Name
    allowForSpouseName: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    allowForSpouseNameRequired: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    status: {
      type: String,
      enum: ["Active", "Deactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Country", countrySchema);