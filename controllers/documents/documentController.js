const { sendSuccess, sendError } = require("../../helpers/apiResponse");
const { createWorker } = require("tesseract.js");
const { parse } = require("mrz");

// =====================================================
// COMMON HELPERS
// =====================================================

const cleanTextLines = (text = "") =>
  String(text)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/[^A-Z0-9<]/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean);

const validISODate = (year, month, day) => {
  const d = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  );

  if (
    d.getUTCFullYear() !== Number(year) ||
    d.getUTCMonth() !== Number(month) - 1 ||
    d.getUTCDate() !== Number(day)
  ) {
    return "";
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
};

const parseMrzDate = (value = "") => {
  const digits = String(value).replace(/\D/g, "");

  if (!/^\d{6}$/.test(digits)) {
    return "";
  }

  const yy = Number(digits.slice(0, 2));
  const nowYY = new Date().getFullYear() % 100;

  // Passport DOBs are in the past.
  const year =
    yy <= (nowYY + 1) % 100 && yy < 80
      ? 2000 + yy
      : 1900 + yy;

  return validISODate(
    year,
    digits.slice(2, 4),
    digits.slice(4, 6)
  );
};

const normalizeMrzCandidate = (line) => {
  let value = String(line || "")
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[^A-Z0-9<]/g, "");

  // Do not pad short OCR lines because padding can shift MRZ fields.
  if (value.length === 45 && value.endsWith("<")) {
    value = value.slice(0, 44);
  }

  if (value.length !== 44) {
    return null;
  }

  return value;
};

// =====================================================
// PASSPORT OCR
// =====================================================

const extractPassportData = async (req, res) => {
  let worker;

  try {
    if (!req.file?.buffer) {
      return sendError(res, 400, "Passport document is required");
    }

    worker = await createWorker("eng");

    const { data } = await worker.recognize(req.file.buffer);
    const rawText = data?.text || "";

    console.log("Passport OCR text:", rawText);

    const lines = cleanTextLines(rawText);
    const candidates = lines
      .map(normalizeMrzCandidate)
      .filter(Boolean);

    let parsed = null;
    let parseError = null;

    // Passport MRZ normally contains two 44-character lines.
    for (let i = 0; i < candidates.length - 1; i++) {
      try {
        const result = parse(
          [candidates[i], candidates[i + 1]],
          { autocorrect: true }
        );

        if (
          result?.fields &&
          (
            result.fields.documentNumber ||
            result.fields.firstName ||
            result.fields.lastName
          )
        ) {
          parsed = result;
          break;
        }
      } catch (err) {
        parseError = err;
      }
    }

    if (!parsed?.fields) {
      console.warn(
        "Passport MRZ not parsed:",
        parseError?.message || "No valid 44-character MRZ pair"
      );

      return sendError(
        res,
        422,
        "Passport details could not be read. Upload a clear image of the passport photo/biodata page with the two MRZ lines visible."
      );
    }

    const f = parsed.fields;

    const firstName = String(f.firstName || "")
      .replace(/<+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const lastName = String(f.lastName || "")
      .replace(/<+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const passportNumber = String(f.documentNumber || "")
      .replace(/</g, "")
      .trim()
      .toUpperCase();

    const nationality = String(f.nationality || "")
      .trim()
      .toUpperCase();

    const sexValue = String(f.sex || "").toUpperCase();

    const sex =
      sexValue === "M"
        ? "Male"
        : sexValue === "F"
        ? "Female"
        : "";

    const dateOfBirth = parseMrzDate(f.birthDate);

    await worker.terminate();
    worker = null;

    return sendSuccess(
      res,
      200,
      "Passport processed successfully",
      {
        data: {
          firstName,
          lastName,
          passportNumber,
          nationality,
          sex,
          dateOfBirth,
          placeOfBirth: "",
        },
      }
    );
  } catch (error) {
    console.error("Passport extraction error:", error);

    return sendError(
      res,
      500,
      "Unable to read passport document"
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.error("Passport OCR cleanup error:", e);
      }
    }
  }
};

// =====================================================
// PAN HELPERS
// =====================================================

const normalizePanCandidate = (text = "") => {
  const compact = String(text)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const direct = compact.match(/[A-Z]{5}[0-9]{4}[A-Z]/);

  if (direct) {
    return direct[0];
  }

  // Correct common OCR character confusions by PAN position.
  if (compact.length < 10) {
    return "";
  }

  const sample = compact.slice(0, 10).split("");

  const toLetter = {
    "0": "O",
    "1": "I",
    "5": "S",
    "8": "B",
  };

  const toDigit = {
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
    sample[i] = /[A-Z]/.test(sample[i])
      ? sample[i]
      : toLetter[sample[i]] || sample[i];
  }

  for (let i = 5; i < 9; i++) {
    sample[i] = /\d/.test(sample[i])
      ? sample[i]
      : toDigit[sample[i]] || sample[i];
  }

  sample[9] = /[A-Z]/.test(sample[9])
    ? sample[9]
    : toLetter[sample[9]] || sample[9];

  const candidate = sample.join("");

  return /^[A-Z]{5}\d{4}[A-Z]$/.test(candidate)
    ? candidate
    : "";
};

// =====================================================
// PAN OCR
// =====================================================

const extractPanData = async (req, res) => {
  let worker;

  try {
    if (!req.file?.buffer) {
      return sendError(res, 400, "PAN card document is required");
    }

    worker = await createWorker("eng");

    const { data } = await worker.recognize(req.file.buffer);
    const rawText = data?.text || "";

    console.log("PAN OCR text:", rawText);

    const lines = cleanTextLines(rawText)
      .map((line) =>
        line
          .replace(/</g, " ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);

    // -------------------------------
    // PAN NUMBER
    // -------------------------------

    let panNumber = "";

    for (const line of lines) {
      panNumber = normalizePanCandidate(line);

      if (panNumber) {
        break;
      }
    }

    if (!panNumber) {
      panNumber = normalizePanCandidate(rawText);
    }

    // -------------------------------
    // CARDHOLDER NAME
    // -------------------------------

    const nameLabels = [
      /^NAME\s*[:.-]?\s*(.*)$/i,
      /^CARD\s*HOLDER\s*NAME\s*[:.-]?\s*(.*)$/i,
    ];

    let name = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const label = nameLabels
        .map((re) => line.match(re))
        .find(Boolean);

      if (label) {
        const sameLine = (label[1] || "")
          .replace(/[^A-Z ]/gi, " ")
          .replace(/\s+/g, " ")
          .trim();

        const nextLine = (lines[i + 1] || "")
          .replace(/[^A-Z ]/gi, " ")
          .replace(/\s+/g, " ")
          .trim();

        name = sameLine || nextLine;

        if (
          name &&
          !/^(FATHER|FATHERS|DATE|DOB|PERMANENT|ACCOUNT|INCOME|TAX|GOVERNMENT|INDIA)\b/i.test(
            name
          )
        ) {
          break;
        }

        name = "";
      }
    }

    // Alternate OCR label variants.
    if (!name) {
      const idx = lines.findIndex(
        (line) =>
          /\bNAME\b/.test(line) &&
          !/FATHER/.test(line)
      );

      if (idx >= 0) {
        const candidate =
          lines[idx]
            .replace(/^.*?\bNAME\b\s*[:.-]?\s*/, "")
            .replace(/[^A-Z ]/g, " ")
            .replace(/\s+/g, " ")
            .trim() ||
          (lines[idx + 1] || "");

        if (
          candidate &&
          !/FATHER|DATE|INCOME|TAX|GOVERNMENT|PERMANENT/i.test(
            candidate
          )
        ) {
          name = candidate
            .replace(/[^A-Z ]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      }
    }

    // -------------------------------
    // DATE OF BIRTH
    // -------------------------------

    let dateOfBirth = "";

    const dobMatch = rawText.match(
      /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/
    );

    if (dobMatch) {
      dateOfBirth = validISODate(
        dobMatch[3],
        dobMatch[2],
        dobMatch[1]
      );
    }

    await worker.terminate();
    worker = null;

    if (!panNumber) {
      return sendError(
        res,
        422,
        "PAN number could not be detected. Upload a clear, straight PAN card image."
      );
    }

    return sendSuccess(
      res,
      200,
      "PAN card processed successfully",
      {
        data: {
          panNumber,
          name,
          dateOfBirth,
        },
      }
    );
  } catch (error) {
    console.error("PAN extraction error:", error);

    return sendError(
      res,
      500,
      "Unable to read PAN card document"
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.error("PAN OCR cleanup error:", e);
      }
    }
  }
};

module.exports = {
  extractPassportData,
  extractPanData,
};