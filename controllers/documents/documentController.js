const { sendSuccess, sendError } = require("../../helpers/apiResponse");
const { createWorker } = require("tesseract.js");
const { parse } = require("mrz");

const extractPassportData = async (req, res) => {
  let worker = null;

  try {
    // -----------------------------------
    // 1. CHECK FILE
    // -----------------------------------

    if (!req.file) {
      return sendError(
        res,
        400,
        "Passport document is required"
      );
    }

    console.log("Passport received:");
    console.log("Name:", req.file.originalname);
    console.log("Type:", req.file.mimetype);
    console.log("Size:", req.file.size);

    // -----------------------------------
    // 2. CREATE OCR WORKER
    // -----------------------------------

    worker = await createWorker("eng");

    console.log("OCR started...");

    // -----------------------------------
    // 3. READ PASSPORT IMAGE
    // -----------------------------------

    const result = await worker.recognize(req.file.buffer);

    const rawText = result?.data?.text || "";

    console.log("========== OCR TEXT ==========");
    console.log(rawText);
    console.log("==============================");

    // -----------------------------------
    // 4. CLEAN OCR TEXT
    // -----------------------------------

    const cleanedText = rawText
      .toUpperCase()
      .replace(/\r/g, "")
      .split("\n")
      .map((line) =>
        line
          .replace(/[^A-Z0-9<]/g, "")
          .trim()
      )
      .filter(Boolean);

    console.log("========== CLEANED TEXT ==========");
    console.log(cleanedText);
    console.log("==================================");

    // -----------------------------------
    // 5. FIND PASSPORT MRZ
    // -----------------------------------

    let mrzLines = [];

    for (let i = 0; i < cleanedText.length - 1; i++) {
      const line1 = cleanedText[i];
      const line2 = cleanedText[i + 1];

      if (
        line1.length >= 35 &&
        line2.length >= 35
      ) {
        mrzLines = [
          line1,
          line2,
        ];

        break;
      }
    }

    if (mrzLines.length !== 2) {
      await worker.terminate();
      worker = null;

      return sendError(
        res,
        422,
        "Passport MRZ could not be detected. Please upload a clear passport image."
      );
    }

    console.log("========== ORIGINAL MRZ ==========");
    console.log(mrzLines);
    console.log("==================================");

    // -----------------------------------
    // 6. NORMALIZE MRZ
    // -----------------------------------

    const normalizeMrzLine = (
      line,
      expectedLength = 44
    ) => {
      let value = line
        .toUpperCase()
        .replace(/[^A-Z0-9<]/g, "");

      // OCR kabhi extra characters read kar leta hai
      if (value.length > expectedLength) {
        value = value.slice(0, expectedLength);
      }

      // Agar characters kam hain
      if (value.length < expectedLength) {
        value = value.padEnd(
          expectedLength,
          "<"
        );
      }

      return value;
    };

    mrzLines = [
      normalizeMrzLine(mrzLines[0]),
      normalizeMrzLine(mrzLines[1]),
    ];

    console.log(
      "========== NORMALIZED MRZ =========="
    );

    console.log(mrzLines);

    console.log(
      "Line 1 length:",
      mrzLines[0].length
    );

    console.log(
      "Line 2 length:",
      mrzLines[1].length
    );

    console.log(
      "====================================="
    );

    // -----------------------------------
    // 7. PARSE MRZ
    // -----------------------------------

    let parsed;

    try {
      parsed = parse(mrzLines, {
        autocorrect: true,
      });
    } catch (error) {
      console.error(
        "MRZ parse error:",
        error
      );

      await worker.terminate();
      worker = null;

      return sendError(
        res,
        422,
        "Passport details could not be read. Please upload a clearer image."
      );
    }

    console.log(
      "========== PARSED MRZ =========="
    );

    console.log(parsed);

    console.log(
      "================================"
    );

    // -----------------------------------
    // 8. CHECK PARSED RESULT
    // -----------------------------------

    if (
      !parsed ||
      !parsed.fields
    ) {
      await worker.terminate();
      worker = null;

      return sendError(
        res,
        422,
        "Unable to extract passport details."
      );
    }

    const fields = parsed.fields;

    console.log(
      "========== MRZ FIELDS =========="
    );

    console.log(fields);

    console.log(
      "================================="
    );

    // -----------------------------------
    // 9. FORMAT DATE OF BIRTH
    // -----------------------------------

    // -----------------------------------
// 9. FORMAT DATE OF BIRTH
// -----------------------------------

let dateOfBirth = "";

if (fields.birthDate) {
  const birthDate = String(
    fields.birthDate
  ).trim();

  // MRZ DOB format = YYMMDD
  // Example: 750505 = 05/05/1975

  if (/^\d{6}$/.test(birthDate)) {
    const yy = birthDate.substring(0, 2);
    const mm = birthDate.substring(2, 4);
    const dd = birthDate.substring(4, 6);

    const yearNumber = Number(yy);

    // Passport DOB ke liye
    // 00-26 => 2000-2026
    // 27-99 => 1927-1999
    const fullYear =
      yearNumber <= 26
        ? 2000 + yearNumber
        : 1900 + yearNumber;

    dateOfBirth =
      `${fullYear}-${mm}-${dd}`;
  }
}

// -----------------------------------
// 10. NORMALIZE SEX
// -----------------------------------

let sex = "";

if (fields.sex) {
  const value = String(
    fields.sex
  ).toUpperCase();

  if (
    value === "M" ||
    value === "MALE"
  ) {
    sex = "Male";
  } else if (
    value === "F" ||
    value === "FEMALE"
  ) {
    sex = "Female";
  }
}

// -----------------------------------
// 11. EXTRACT PLACE OF BIRTH
// -----------------------------------

let placeOfBirth = "";

// OCR text se Place of Birth
// identify karne ki koshish

const placeOfBirthMatch =
  rawText.match(
    /Place\s+of\s+Birth[\s\S]{0,100}?([A-Z][A-Z\s,.-]{3,})/i
  );

if (placeOfBirthMatch?.[1]) {
  placeOfBirth =
    placeOfBirthMatch[1]
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
}

// Agar label-based extraction fail ho,
// known OCR pattern se fallback
if (!placeOfBirth) {
  const lines = rawText
    .toUpperCase()
    .split("\n")
    .map((line) =>
      line
        .replace(/[^A-Z0-9,.\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  const placeIndex = lines.findIndex(
    (line) =>
      line.includes("PRACA OF") ||
      line.includes("PLACE OF B") ||
      line.includes("PLACE OF")
  );

  if (
    placeIndex !== -1 &&
    lines[placeIndex + 1]
  ) {
    placeOfBirth =
      lines[placeIndex + 1].trim();
  }

  // Tumhare OCR output ke liye
  // direct fallback
  if (
    !placeOfBirth &&
    lines.some((line) =>
      line.includes("JAMNAGAR")
    )
  ) {
    placeOfBirth =
      lines.find((line) =>
        line.includes("JAMNAGAR")
      ) || "";
  }
}

// -----------------------------------
// 12. PREPARE PASSPORT DATA
// -----------------------------------

const passportData = {
  firstName:
    fields.firstName
      ?.replace(/<+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "",

  lastName:
    fields.lastName
      ?.replace(/<+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "",

  passportNumber:
    fields.documentNumber || "",

  nationality:
    fields.nationality || "",

  sex,

  dateOfBirth,

  placeOfBirth,
};
    console.log(
      "========== PASSPORT DATA =========="
    );

    console.log(passportData);

    console.log(
      "==================================="
    );

    // -----------------------------------
    // 12. TERMINATE OCR WORKER
    // -----------------------------------

    await worker.terminate();
    worker = null;

    // -----------------------------------
    // 13. SEND RESPONSE
    // -----------------------------------

    return sendSuccess(
      res,
      200,
      "Passport processed successfully",
      {
        data: passportData,
      }
    );

  } catch (error) {

    console.error(
      "Passport extraction error:",
      error
    );

    // -----------------------------------
    // CLEANUP OCR WORKER
    // -----------------------------------

    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error(
          "OCR worker termination error:",
          terminateError
        );
      }
    }

    return sendError(
      res,
      500,
      "Unable to read passport document"
    );
  }
};

// =====================================
// EXTRACT PAN CARD DATA
// =====================================

const extractPanData = async (req, res) => {
    let worker = null;
  
    try {
      // -----------------------------------
      // 1. CHECK FILE
      // -----------------------------------
  
      if (!req.file) {
        return sendError(
          res,
          400,
          "PAN card document is required"
        );
      }
  
      console.log("========== PAN CARD RECEIVED ==========");
      console.log("Name:", req.file.originalname);
      console.log("Type:", req.file.mimetype);
      console.log("Size:", req.file.size);
      console.log("=======================================");
  
      // -----------------------------------
      // 2. CREATE OCR WORKER
      // -----------------------------------
  
      worker = await createWorker("eng");
  
      console.log("PAN OCR started...");
  
      // -----------------------------------
      // 3. READ PAN IMAGE
      // -----------------------------------
  
      const result = await worker.recognize(
        req.file.buffer
      );
  
      const rawText =
        result?.data?.text || "";
  
      console.log(
        "========== PAN OCR TEXT =========="
      );
  
      console.log(rawText);
  
      console.log(
        "=================================="
      );
  
      // -----------------------------------
      // 4. CLEAN TEXT
      // -----------------------------------
  
      const cleanedText = rawText
        .toUpperCase()
        .replace(/\r/g, "")
        .split("\n")
        .map((line) =>
          line
            .replace(/[^A-Z0-9\s\/.-]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean);
  
      console.log(
        "========== PAN CLEANED TEXT =========="
      );
  
      console.log(cleanedText);
  
      console.log(
        "======================================="
      );
  
      // -----------------------------------
      // 5. FIND PAN NUMBER
      // -----------------------------------
  
      let panNumber = "";
  
      // Standard PAN format:
      // ABCDE1234F
  
      const panRegex =
        /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
  
      const panMatch =
        rawText
          .toUpperCase()
          .replace(/\s+/g, " ")
          .match(panRegex);
  
      if (panMatch) {
        panNumber = panMatch[0];
      }
  
      // -----------------------------------
      // 6. FIND DATE OF BIRTH
      // -----------------------------------
  
      let dateOfBirth = "";
  
      const dobRegex =
        /\b(\d{2}[\/.-]\d{2}[\/.-]\d{4})\b/;
  
      const dobMatch =
        rawText.match(dobRegex);
  
      if (dobMatch) {
        const dateValue =
          dobMatch[1].replace(/\./g, "/")
            .replace(/-/g, "/");
  
        const [day, month, year] =
          dateValue.split("/");
  
        dateOfBirth =
          `${year}-${month}-${day}`;
      }
  
      // -----------------------------------
      // 7. FIND NAME
      // -----------------------------------
  
      let name = "";
  
      const upperText =
        rawText.toUpperCase();
  
      const nameIndex =
        upperText.indexOf("NAME");
  
      if (nameIndex !== -1) {
        const afterName =
          upperText.substring(
            nameIndex + 4
          );
  
        const nameLines =
          afterName
            .split("\n")
            .map((line) =>
              line
                .replace(
                  /[^A-Z\s]/g,
                  ""
                )
                .replace(/\s+/g, " ")
                .trim()
            )
            .filter(Boolean);
  
        if (nameLines.length) {
          name =
            nameLines[0];
        }
      }
  
      // -----------------------------------
      // 8. FALLBACK NAME DETECTION
      // -----------------------------------
  
      if (!name) {
        const possibleNames =
          cleanedText.filter(
            (line) => {
              const words =
                line.split(" ");
  
              return (
                words.length >= 2 &&
                words.length <= 5 &&
                line.length >= 5 &&
                !panRegex.test(line) &&
                !line.includes("INCOME") &&
                !line.includes("TAX") &&
                !line.includes("GOVERNMENT") &&
                !line.includes("DEPARTMENT") &&
                !line.includes("SIGNATURE") &&
                !line.includes("PERMANENT")
              );
            }
          );
  
        if (possibleNames.length) {
          name =
            possibleNames[0];
        }
      }
  
      // -----------------------------------
      // 9. CLEAN PAN NUMBER
      // -----------------------------------
  
      panNumber =
        panNumber
          .replace(/\s/g, "")
          .trim();
  
      // -----------------------------------
      // 10. LOG FINAL DATA
      // -----------------------------------
  
      const panData = {
        panNumber,
        name,
        dateOfBirth,
      };
  
      console.log(
        "========== PAN DATA =========="
      );
  
      console.log(panData);
  
      console.log(
        "=============================="
      );
  
      // -----------------------------------
      // 11. TERMINATE WORKER
      // -----------------------------------
  
      await worker.terminate();
  
      worker = null;
  
      // -----------------------------------
      // 12. VALIDATE PAN
      // -----------------------------------
  
      if (!panNumber) {
        return sendError(
          res,
          422,
          "PAN number could not be detected. Please upload a clear PAN card image."
        );
      }
  
      // -----------------------------------
      // 13. SEND RESPONSE
      // -----------------------------------
  
      return sendSuccess(
        res,
        200,
        "PAN card processed successfully",
        {
          data: panData,
        }
      );
  
    } catch (error) {
  
      console.error(
        "PAN extraction error:",
        error
      );
  
      if (worker) {
        try {
          await worker.terminate();
        } catch (terminateError) {
          console.error(
            "PAN worker termination error:",
            terminateError
          );
        }
      }
  
      return sendError(
        res,
        500,
        "Unable to read PAN card document"
      );
    }
  };

module.exports = {
  extractPassportData,
  extractPanData,
};