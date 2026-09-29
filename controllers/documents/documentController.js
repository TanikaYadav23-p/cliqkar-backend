const { sendSuccess, sendError } = require("../../helpers/apiResponse");
const { createWorker } = require("tesseract.js");
const { parse } = require("mrz");
const sharp = require("sharp");

// =====================================================
// DATE VALIDATION
// =====================================================

const validISODate = (year, month, day) => {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    !Number.isInteger(d) ||
    y < 1900 ||
    y > new Date().getFullYear() ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return "";
  }

  const date = new Date(Date.UTC(y, m - 1, d));

  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return "";
  }

  return `${String(y).padStart(4, "0")}-${String(m).padStart(
    2,
    "0"
  )}-${String(d).padStart(2, "0")}`;
};

const parseMrzDate = (value = "") => {
  const digits = String(value).replace(/\D/g, "");

  if (!/^\d{6}$/.test(digits)) {
    return "";
  }

  const yy = Number(digits.substring(0, 2));
  const month = digits.substring(2, 4);
  const day = digits.substring(4, 6);

  // Two-digit year interpretation.
  // Current year and future years use 2000;
  // older years use 1900.
  const currentYY = new Date().getFullYear() % 100;

  const year = yy <= currentYY ? 2000 + yy : 1900 + yy;

  return validISODate(year, month, day);
};

// =====================================================
// TEXT HELPERS
// =====================================================

const normalizeMrzLine = (line = "") =>
  String(line)
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[^A-Z0-9<]/g, "");

const cleanOcrLines = (text = "") =>
  String(text)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

// =====================================================
// IMAGE PREPROCESSING
// =====================================================

const preprocessImage = async (buffer, options = {}) => {
  const metadata = await sharp(buffer, {
    failOn: "none",
  }).metadata();

  const width = metadata.width || 1600;
  const height = metadata.height || 1000;

  let pipeline = sharp(buffer, {
    failOn: "none",
  }).rotate();

  if (options.crop === "mrz") {
    const top = Math.floor(height * 0.5);

    pipeline = pipeline.extract({
      left: 0,
      top,
      width,
      height: Math.max(1, height - top),
    });
  }

  if (options.crop === "lower") {
    const top = Math.floor(height * 0.4);

    pipeline = pipeline.extract({
      left: 0,
      top,
      width,
      height: Math.max(1, height - top),
    });
  }

  pipeline = pipeline.grayscale().normalize().sharpen();

  if (options.threshold) {
    pipeline = pipeline.threshold(options.threshold);
  }

  return pipeline
    .resize({
      width: options.width || 2800,
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
};

// =====================================================
// OCR WORKER
// =====================================================

const createOcrWorker = async () => {
  const worker = await createWorker("eng");

  await worker.setParameters({
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });

  return worker;
};

// =====================================================
// FIND PASSPORT MRZ PAIRS
// =====================================================

const findPassportMrzPairs = (text = "") => {
  const lines = String(text)
    .toUpperCase()
    .split(/\r?\n/)
    .map(normalizeMrzLine)
    .filter(Boolean);

  const pairs = [];

  for (let i = 0; i < lines.length - 1; i++) {
    let line1 = lines[i];
    let line2 = lines[i + 1];

    if (line1.length < 35 || line2.length < 35) {
      continue;
    }

    if (!line1.startsWith("P")) {
      continue;
    }

    if (line1.length > 44) {
      line1 = line1.substring(0, 44);
    }

    if (line2.length > 44) {
      line2 = line2.substring(0, 44);
    }

    if (line1.length === 44 && line2.length === 44) {
      pairs.push([line1, line2]);
    }
  }

  return pairs;
};

// =====================================================
// PASSPORT NAME EXTRACTION
//
// TD3 Passport MRZ name format:
// P<INDYADAV<<TANIKA<PRIYA<<<<<<<<
//
// Surname     = YADAV
// Given names = TANIKA PRIYA
//
// First Name  = TANIKA PRIYA
// Last Name   = YADAV
// =====================================================

const cleanMrzName = (value = "") => {
  return String(value)
    .toUpperCase()
    .replace(/</g, " ")
    .replace(/[^A-Z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const isValidMrzName = (value = "") => {
  if (!value) {
    return false;
  }

  const words = value.split(/\s+/).filter(Boolean);

  return (
    words.length >= 1 &&
    words.length <= 6 &&
    words.every((word) => /^[A-Z][A-Z'-]*$/.test(word)) &&
    !/\b(PASSPORT|REPUBLIC|INDIA|SURNAME|GIVEN|NAME)\b/.test(value)
  );
};

const extractNamesFromMrzLine = (mrzLine = "", parsedFields = {}) => {
  const line = normalizeMrzLine(mrzLine);

  console.log("MRZ NAME LINE:", line);

  let firstName = "";
  let lastName = "";

  // First, try the MRZ parser's returned name fields.
  // Different mrz package versions may expose different field names.
  const parsedGivenNames =
    parsedFields.firstName ||
    parsedFields.givenNames ||
    parsedFields.givenName ||
    "";

  const parsedSurname =
    parsedFields.lastName ||
    parsedFields.surname ||
    parsedFields.familyName ||
    "";

  firstName = cleanMrzName(parsedGivenNames);
  lastName = cleanMrzName(parsedSurname);

  // If either name is missing, extract from the original MRZ name line.
  if (
    (!firstName || !lastName) &&
    line.startsWith("P<") &&
    line.length >= 10
  ) {
    // TD3:
    // 0-1 = P<
    // 2-4 = issuing country
    // 5 onward = surname<<given names
    const nameSection = line.substring(5);
    const separatorIndex = nameSection.indexOf("<<");

    if (separatorIndex !== -1) {
      const mrzSurname = cleanMrzName(
        nameSection.substring(0, separatorIndex)
      );

      const mrzGivenNames = cleanMrzName(
        nameSection.substring(separatorIndex + 2)
      );

      if (!lastName && isValidMrzName(mrzSurname)) {
        lastName = mrzSurname;
      }

      if (!firstName && isValidMrzName(mrzGivenNames)) {
        firstName = mrzGivenNames;
      }
    }
  }

  if (!isValidMrzName(firstName)) {
    firstName = "";
  }

  if (!isValidMrzName(lastName)) {
    lastName = "";
  }

  console.log("MRZ NAME RESULT:", {
    firstName,
    lastName,
  });

  return {
    firstName,
    lastName,
  };
};

// =====================================================
// NATIONALITY
// =====================================================

const normalizeNationality = (value = "") => {
  const v = String(value)
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .trim();

  const map = {
    IND: "Indian",
    INDIA: "Indian",
    INDIAN: "Indian",
    ARE: "United Arab Emirates",
    UAE: "United Arab Emirates",
    USA: "United States",
    GBR: "United Kingdom",
    CAN: "Canada",
    AUS: "Australia",
  };

  return map[v] || "";
};

// =====================================================
// SEX
// =====================================================

const normalizeSex = (value = "") => {
  const v = String(value)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (v === "M" || v === "MALE") {
    return "Male";
  }

  if (v === "F" || v === "FEMALE") {
    return "Female";
  }

  return "";
};

// =====================================================
// DATE EXTRACTION FROM OCR
// =====================================================

const extractDateFromText = (text = "") => {
  const formats = [
    /(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{4})/,
    /(\d{4})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{1,2})/,
  ];

  for (const regex of formats) {
    const match = String(text).match(regex);

    if (!match) {
      continue;
    }

    let year;
    let month;
    let day;

    if (match[1].length === 4) {
      year = match[1];
      month = match[2];
      day = match[3];
    } else {
      day = match[1];
      month = match[2];
      year = match[3];
    }

    const date = validISODate(year, month, day);

    if (date) {
      return date;
    }
  }

  return "";
};

// =====================================================
// LABEL-BASED OCR HELPERS
// =====================================================

const extractLabeledValue = (lines, labels) => {
  const regex = new RegExp(
    `^\\s*(?:${labels.join("|")})\\s*[:.-]?\\s*(.*)$`,
    "i"
  );

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(regex);

    if (!match) {
      continue;
    }

    const sameLine = match[1]?.replace(/\s+/g, " ").trim();

    if (sameLine) {
      return sameLine;
    }

    if (lines[i + 1]) {
      return lines[i + 1].trim();
    }
  }

  return "";
};

// =====================================================
// PASSPORT NORMAL OCR FIELDS
//
// Note: Names are intentionally NOT extracted here.
// Name extraction must come from MRZ to avoid filling
// unrelated OCR text into First Name / Last Name.
// =====================================================

const extractPassportFieldsFromOcr = (text = "") => {
  const lines = cleanOcrLines(String(text).toUpperCase());

  const passportNumber = extractLabeledValue(lines, [
    "PASSPORT NO",
    "PASSPORT NUMBER",
    "DOCUMENT NO",
    "DOCUMENT NUMBER",
  ])
    .replace(/[^A-Z0-9]/g, "")
    .trim();

  const nationality = extractLabeledValue(lines, ["NATIONALITY"]);

  const sex = extractLabeledValue(lines, ["SEX", "GENDER"]);

  const dobLine = extractLabeledValue(lines, [
    "DATE OF BIRTH",
    "DOB",
    "BIRTH",
  ]);

  const dateOfBirth = extractDateFromText(dobLine);

  const placeOfBirth = extractLabeledValue(lines, ["PLACE OF BIRTH"]);

  return {
    firstName: "",
    lastName: "",

    passportNumber: /^[A-Z0-9]{6,12}$/.test(passportNumber)
      ? passportNumber
      : "",

    nationality: normalizeNationality(nationality),
    sex: normalizeSex(sex),
    dateOfBirth,

    placeOfBirth: placeOfBirth
      .replace(/[^A-Z0-9 ,.'-]/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  };
};

// =====================================================
// PASSPORT OCR
// =====================================================

const extractPassportData = async (req, res) => {
  let worker = null;

  try {
    if (!req.file?.buffer) {
      return sendError(res, 400, "Passport document is required");
    }

    console.log("Passport OCR started:", req.file.originalname);

    worker = await createOcrWorker();

    const images = [
      await preprocessImage(req.file.buffer, {
        width: 3000,
      }),

      await preprocessImage(req.file.buffer, {
        width: 3000,
        threshold: 160,
      }),

      await preprocessImage(req.file.buffer, {
        width: 3000,
        threshold: 190,
      }),

      await preprocessImage(req.file.buffer, {
        width: 3000,
        crop: "mrz",
      }),

      await preprocessImage(req.file.buffer, {
        width: 3000,
        crop: "lower",
      }),
    ];

    const ocrTexts = [];

    for (const image of images) {
      for (const mode of ["6", "11", "12"]) {
        await worker.setParameters({
          tessedit_pageseg_mode: mode,
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
        });

        const result = await worker.recognize(image);
        const text = result?.data?.text || "";

        if (text.trim()) {
          ocrTexts.push(text);
        }
      }
    }

    console.log("Passport OCR attempts:", ocrTexts.length);

    let mrzResult = null;
    let selectedMrz = null;

    // Find and parse the passport MRZ.
    for (const text of ocrTexts) {
      const pairs = findPassportMrzPairs(text);

      for (const pair of pairs) {
        try {
          const parsed = parse(pair, {
            autocorrect: true,
          });

          if (parsed?.fields?.documentNumber) {
            mrzResult = parsed;
            selectedMrz = pair;
            break;
          }
        } catch (error) {
          console.log("MRZ parse retry:", error.message);
        }
      }

      if (mrzResult) {
        break;
      }
    }

    let mrzData = {
      firstName: "",
      lastName: "",
      passportNumber: "",
      nationality: "",
      sex: "",
      dateOfBirth: "",
    };

    if (mrzResult && selectedMrz) {
      const fields = mrzResult.fields;

      // Important: pass parsed fields as well as the MRZ name line.
      const names = extractNamesFromMrzLine(
        selectedMrz[0],
        fields
      );

      mrzData = {
        firstName: names.firstName,
        lastName: names.lastName,

        passportNumber: String(fields.documentNumber || "")
          .replace(/</g, "")
          .trim()
          .toUpperCase(),

        nationality: normalizeNationality(fields.nationality),
        sex: normalizeSex(fields.sex),
        dateOfBirth: parseMrzDate(fields.birthDate),
      };
    }

    console.log("MRZ DATA:", mrzData);

    const combinedText = ocrTexts.join("\n");

    const normalOcrData = extractPassportFieldsFromOcr(combinedText);

    console.log("NORMAL OCR DATA:", normalOcrData);

    const passportData = {
      // Names are only taken from MRZ extraction.
      // No uncertain normal OCR name fallback.
      firstName: mrzData.firstName || "",
      lastName: mrzData.lastName || "",

      passportNumber:
        mrzData.passportNumber ||
        normalOcrData.passportNumber ||
        "",

      nationality:
        mrzData.nationality ||
        normalOcrData.nationality ||
        "",

      sex: mrzData.sex || normalOcrData.sex || "",

      dateOfBirth:
        mrzData.dateOfBirth ||
        normalOcrData.dateOfBirth ||
        "",

      placeOfBirth: normalOcrData.placeOfBirth || "",
    };

    console.log("FINAL PASSPORT DATA:", passportData);

    if (
      !passportData.firstName &&
      !passportData.lastName &&
      !passportData.passportNumber
    ) {
      return sendError(
        res,
        422,
        "Passport details could not be read. Please upload a clear passport biodata page with both MRZ lines visible."
      );
    }

    return sendSuccess(res, 200, "Passport processed successfully", {
      data: passportData,
      verifiedByMrz: Boolean(mrzResult),
    });
  } catch (error) {
    console.error("Passport extraction error:", error);

    return sendError(
      res,
      500,
      "Unable to process passport image. Please try a clearer passport image."
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error("Passport OCR worker cleanup error:", error);
      }
    }
  }
};

// =====================================================
// PAN HELPERS
// =====================================================

const normalizePanCandidate = (value = "") => {
  const candidate = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (candidate.length !== 10) {
    return "";
  }

  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(candidate)) {
    return candidate;
  }

  return "";
};

const extractPanNumber = (text = "") => {
  const compact = String(text)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  for (let i = 0; i <= compact.length - 10; i++) {
    const value = normalizePanCandidate(compact.substring(i, i + 10));

    if (value) {
      return value;
    }
  }

  return "";
};

const splitFullName = (fullName = "") => {
  const words = String(fullName)
    .replace(/[^A-Z ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length >= 2) {
    return {
      firstName: words.slice(0, -1).join(" "),
      lastName: words[words.length - 1],
    };
  }

  return {
    firstName: words[0] || "",
    lastName: "",
  };
};

const extractPanName = (text = "") => {
  const lines = cleanOcrLines(String(text).toUpperCase());

  for (let i = 0; i < lines.length; i++) {
    if (/\bNAME\b/i.test(lines[i])) {
      const sameLine = lines[i]
        .replace(/^.*?\bNAME\b\s*:?\s*/i, "")
        .trim();

      if (sameLine && sameLine.length > 3) {
        return sameLine;
      }

      if (lines[i + 1]) {
        return lines[i + 1];
      }
    }
  }

  return "";
};

// =====================================================
// PAN OCR
// =====================================================

const extractPanData = async (req, res) => {
  let worker = null;

  try {
    if (!req.file?.buffer) {
      return sendError(res, 400, "PAN card document is required");
    }

    console.log("PAN OCR started:", req.file.originalname);

    worker = await createOcrWorker();

    const image = await preprocessImage(req.file.buffer, {
      width: 2800,
    });

    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    const result = await worker.recognize(image);
    const text = result?.data?.text || "";

    console.log("PAN OCR TEXT:", text);

    const panNumber = extractPanNumber(text);
    const name = extractPanName(text);
    const names = splitFullName(name);
    const dateOfBirth = extractDateFromText(text);

    if (!panNumber) {
      return sendError(
        res,
        422,
        "PAN number could not be read. Please upload a clear PAN card image."
      );
    }

    return sendSuccess(res, 200, "PAN card processed successfully", {
      data: {
        panNumber,
        name,
        firstName: names.firstName,
        lastName: names.lastName,
        dateOfBirth,
      },
    });
  } catch (error) {
    console.error("PAN extraction error:", error);

    return sendError(
      res,
      500,
      "Unable to process PAN card image."
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error("PAN OCR worker cleanup error:", error);
      }
    }
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  extractPassportData,
  extractPanData,
};