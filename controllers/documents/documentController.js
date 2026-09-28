const { sendSuccess, sendError } = require("../../helpers/apiResponse");
const { createWorker } = require("tesseract.js");
const { parse } = require("mrz");
const sharp = require("sharp");

// =====================================================
// COMMON HELPERS
// =====================================================

const normalizeText = (value = "") =>
  String(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

const validISODate = (year, month, day) => {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (!y || m < 1 || m > 12 || d < 1 || d > 31) {
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

  if (!/^\d{6}$/.test(digits)) return "";

  const yy = Number(digits.slice(0, 2));
  const month = digits.slice(2, 4);
  const day = digits.slice(4, 6);

  // Current-century pivot for DOBs:
  // 00–current year => 2000s; remaining years => 1900s.
  const currentYY = new Date().getFullYear() % 100;
  const year = yy <= currentYY ? 2000 + yy : 1900 + yy;

  return validISODate(year, month, day);
};

const normalizeMrzLine = (line = "") =>
  String(line)
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[^A-Z0-9<]/g, "");

const cleanPanText = (text = "") =>
  String(text)
    .toUpperCase()
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

// Preprocess image for OCR. Keep the original dimensions/contents,
// but improve contrast and readability.
const preprocessImage = async (buffer, options = {}) => {
  const image = sharp(buffer, { failOn: "none" });
  const metadata = await image.metadata();

  let pipeline = image.rotate().grayscale().normalize().sharpen();

  if (options.passport) {
    // MRZ is normally printed at the bottom of the passport biodata page.
    // Crop only the lower portion for a dedicated MRZ OCR attempt.
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width > 0 && height > 0) {
      const top = Math.floor(height * 0.58);
      const cropHeight = height - top;

      pipeline = sharp(buffer, { failOn: "none" })
        .rotate()
        .extract({
          left: 0,
          top,
          width,
          height: cropHeight,
        })
        .grayscale()
        .normalize()
        .sharpen();
    }
  }

  return pipeline
    .resize({
      width: 2200,
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
};

const createOcrWorker = async () => {
  const worker = await createWorker("eng");

  await worker.setParameters({
    preserve_interword_spaces: "1",
  });

  return worker;
};

// =====================================================
// PASSPORT MRZ HELPERS
// =====================================================

// Passport TD3 MRZ:
// Line 1 starts with P< and contains names.
// Line 2 contains document number, nationality, DOB, sex, expiry, etc.
const findPassportMrzPairs = (text = "") => {
  const lines = String(text)
    .toUpperCase()
    .split(/\r?\n/)
    .map(normalizeMrzLine)
    .filter(Boolean);

  const pairs = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];

    // Do not pad short OCR lines. Padding can shift all MRZ fields.
    if (
      line1.length >= 40 &&
      line1.length <= 48 &&
      line2.length >= 40 &&
      line2.length <= 48
    ) {
      // Only trim surplus OCR characters when the line clearly
      // begins with a valid passport MRZ marker.
      let first = line1;
      let second = line2;

      if (first.length > 44) first = first.slice(0, 44);
      if (second.length > 44) second = second.slice(0, 44);

      if (first.length === 44 && second.length === 44) {
        pairs.push([first, second]);
      }
    }
  }

  return pairs;
};

const isValidPassportResult = (result) => {
  if (!result || !result.fields) return false;

  // Require the parser's validation result to be true.
  // Do not auto-fill from a merely parseable but invalid MRZ.
  if (result.valid !== true) return false;

  const fields = result.fields;

  const passportNumber = String(fields.documentNumber || "")
    .replace(/</g, "")
    .trim()
    .toUpperCase();

  const nationality = String(fields.nationality || "")
    .trim()
    .toUpperCase();

  const birthDate = String(fields.birthDate || "").replace(/\D/g, "");

  return (
    /^[A-Z0-9]{6,12}$/.test(passportNumber) &&
    /^[A-Z]{3}$/.test(nationality) &&
    /^\d{6}$/.test(birthDate) &&
    Boolean(parseMrzDate(birthDate)) &&
    Boolean(fields.firstName || fields.lastName)
  );
};

// =====================================================
// EXTRACT PASSPORT DATA
// =====================================================

const extractPassportData = async (req, res) => {
  let worker = null;

  try {
    if (!req.file?.buffer) {
      return sendError(res, 400, "Passport document is required");
    }

    if (
      req.file.mimetype &&
      !["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)
    ) {
      return sendError(
        res,
        400,
        "Please upload a JPG, PNG, or WEBP passport image."
      );
    }

    console.log("Passport OCR received:", {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });

    worker = await createOcrWorker();

    const originalBuffer = req.file.buffer;
    const processedFullImage = await preprocessImage(originalBuffer);
    const processedMrzImage = await preprocessImage(originalBuffer, {
      passport: true,
    });

    const ocrResults = [];

    // Try full image and dedicated MRZ crop using different segmentation modes.
    // This improves detection without fabricating/padding missing characters.
    for (const imageBuffer of [processedFullImage, processedMrzImage]) {
      for (const pageSegMode of ["6", "11", "13"]) {
        await worker.setParameters({
          tessedit_pageseg_mode: pageSegMode,
          preserve_interword_spaces: "1",
        });

        const result = await worker.recognize(imageBuffer);
        const text = result?.data?.text || "";

        if (text.trim()) {
          ocrResults.push(text);
        }
      }
    }

    console.log("Passport OCR attempts completed:", ocrResults.length);

    let validParsedResult = null;
    let selectedMrz = null;

    for (const text of ocrResults) {
      const pairs = findPassportMrzPairs(text);

      for (const pair of pairs) {
        try {
          const parsed = parse(pair, { autocorrect: true });

          if (isValidPassportResult(parsed)) {
            validParsedResult = parsed;
            selectedMrz = pair;
            break;
          }
        } catch (error) {
          // Try the next candidate pair.
        }
      }

      if (validParsedResult) break;
    }

    if (!validParsedResult) {
      return sendError(
        res,
        422,
        "Passport could not be verified. Upload a clear, straight photo of the passport biodata page with both bottom MRZ lines fully visible."
      );
    }

    const fields = validParsedResult.fields;

    const firstName = String(fields.firstName || "")
      .replace(/<+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const lastName = String(fields.lastName || "")
      .replace(/<+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const passportNumber = String(fields.documentNumber || "")
      .replace(/</g, "")
      .trim()
      .toUpperCase();

    const nationality = String(fields.nationality || "")
      .trim()
      .toUpperCase();

    const sexValue = String(fields.sex || "").toUpperCase();

    const sex =
      sexValue === "M"
        ? "Male"
        : sexValue === "F"
        ? "Female"
        : "";

    const dateOfBirth = parseMrzDate(fields.birthDate);

    // Place of birth is not reliably encoded in the passport MRZ.
    // Do not guess it from unrelated OCR text.
    const passportData = {
      firstName,
      lastName,
      passportNumber,
      nationality,
      sex,
      dateOfBirth,
      placeOfBirth: "",
    };

    console.log("Verified passport MRZ:", selectedMrz);
    console.log("Passport fields extracted:", {
      passportNumber: Boolean(passportNumber),
      name: Boolean(firstName || lastName),
      nationality: Boolean(nationality),
      dateOfBirth: Boolean(dateOfBirth),
      sex: Boolean(sex),
    });

    return sendSuccess(res, 200, "Passport processed successfully", {
      data: passportData,
    });
  } catch (error) {
    console.error("Passport extraction error:", error);

    return sendError(
      res,
      500,
      "Unable to process passport image. Please try a clearer image."
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
  const compact = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  // Correct only common OCR confusions at their expected positions.
  if (compact.length !== 10) return "";

  const chars = compact.split("");

  const letterMap = {
    0: "O",
    1: "I",
    5: "S",
    8: "B",
  };

  const digitMap = {
    O: "0",
    Q: "0",
    D: "0",
    I: "1",
    L: "1",
    Z: "2",
    S: "5",
    G: "6",
    B: "8",
  };

  for (let i = 0; i < 5; i++) {
    if (!/[A-Z]/.test(chars[i])) {
      chars[i] = letterMap[chars[i]] || chars[i];
    }
  }

  for (let i = 5; i <= 8; i++) {
    if (!/[0-9]/.test(chars[i])) {
      chars[i] = digitMap[chars[i]] || chars[i];
    }
  }

  if (!/[A-Z]/.test(chars[9])) {
    chars[9] = letterMap[chars[9]] || chars[9];
  }

  const candidate = chars.join("");

  // PAN fourth character identifies holder type.
  // Reject an OCR result if that position is not a recognized type.
  const validHolderTypes = "PCHFA TBLJG".replace(/\s/g, "");

  if (
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(candidate) ||
    !validHolderTypes.includes(candidate[3])
  ) {
    return "";
  }

  return candidate;
};

const extractPanNumber = (text = "") => {
  const lines = cleanPanText(text);

  for (const line of lines) {
    const compact = line.replace(/[^A-Z0-9]/g, "");

    // Search exact 10-character windows rather than accepting
    // arbitrary substrings from unrelated text.
    for (let i = 0; i <= compact.length - 10; i++) {
      const candidate = normalizePanCandidate(
        compact.slice(i, i + 10)
      );

      if (candidate) return candidate;
    }
  }

  return "";
};

const extractPanDateOfBirth = (text = "") => {
  const lines = cleanPanText(text);

  const dobLabel =
    /\b(DATE\s+OF\s+BIRTH|DOB|DATE\s+OF\s+INCORPORATION)\b/i;

  const dateRegex =
    /(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{4})/;

  for (let i = 0; i < lines.length; i++) {
    if (!dobLabel.test(lines[i])) continue;

    // Date may be printed on the same line or the following line.
    const nearbyText = `${lines[i]} ${lines[i + 1] || ""}`;
    const match = nearbyText.match(dateRegex);

    if (!match) continue;

    const isoDate = validISODate(match[3], match[2], match[1]);

    if (isoDate) return isoDate;
  }

  // Do not select a random date elsewhere on the card.
  return "";
};

const extractPanName = (text = "") => {
  const lines = cleanPanText(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Only use an explicit NAME label; never guess from arbitrary lines.
    const match = line.match(
      /^\s*(?:CARD\s*HOLDER\s*)?NAME\s*[:.-]?\s*(.*)$/i
    );

    if (!match) continue;

    const sameLineName = String(match[1] || "")
      .replace(/[^A-Z ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const nextLine = String(lines[i + 1] || "")
      .replace(/[^A-Z ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    let candidate = sameLineName || nextLine;

    // Refuse label-like or government text.
    if (
      !candidate ||
      /\b(FATHER|FATHERS|DOB|DATE|INCOME|TAX|GOVERNMENT|INDIA|PERMANENT|ACCOUNT)\b/.test(
        candidate
      )
    ) {
      continue;
    }

    const words = candidate.split(/\s+/).filter(Boolean);

    if (
      words.length >= 2 &&
      words.length <= 5 &&
      words.every((word) => /^[A-Z]+$/.test(word))
    ) {
      return candidate;
    }
  }

  return "";
};

// =====================================================
// EXTRACT PAN DATA
// =====================================================

const extractPanData = async (req, res) => {
  let worker = null;

  try {
    if (!req.file?.buffer) {
      return sendError(res, 400, "PAN card document is required");
    }

    if (
      req.file.mimetype &&
      !["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)
    ) {
      return sendError(
        res,
        400,
        "Please upload a JPG, PNG, or WEBP PAN card image."
      );
    }

    console.log("PAN OCR received:", {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });

    worker = await createOcrWorker();

    const processedImage = await preprocessImage(req.file.buffer);
    const ocrTexts = [];

    for (const pageSegMode of ["6", "11", "12"]) {
      await worker.setParameters({
        tessedit_pageseg_mode: pageSegMode,
        preserve_interword_spaces: "1",
      });

      const result = await worker.recognize(processedImage);
      const text = result?.data?.text || "";

      if (text.trim()) {
        ocrTexts.push(text);
      }
    }

    // Use the best available OCR text; do not infer values from unrelated fields.
    const combinedText = ocrTexts.join("\n");
    console.log("PAN OCR attempts completed:", ocrTexts.length);

    const panNumber = extractPanNumber(combinedText);
    const name = extractPanName(combinedText);
    const dateOfBirth = extractPanDateOfBirth(combinedText);

    if (!panNumber) {
      return sendError(
        res,
        422,
        "PAN number could not be verified. Upload a clear, straight image of the PAN card."
      );
    }

    const panData = {
      panNumber,
      name,
      dateOfBirth,
    };

    console.log("PAN extraction status:", {
      panNumberVerified: true,
      nameFound: Boolean(name),
      dateOfBirthFound: Boolean(dateOfBirth),
    });

    return sendSuccess(res, 200, "PAN card processed successfully", {
      data: panData,
    });
  } catch (error) {
    console.error("PAN extraction error:", error);

    return sendError(
      res,
      500,
      "Unable to process PAN card image. Please try a clearer image."
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

module.exports = {
  extractPassportData,
  extractPanData,
};