const axios = require("axios");

/**
 * Convert frontend date format YYYY-MM-DD
 * into ETRAV format DD/MM/YYYY
 *
 * Example:
 * 2026-10-01 -> 01/10/2026
 */
/**
 * Convert frontend date format YYYY-MM-DD
 * into ETRAV format DD/MM/YYYY
 *
 * Example:
 * 2026-10-01 -> 01/10/2026
 */
const formatEtravDate = (date) => {
    if (!date) return null;
  
    // Already in MM/DD/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
  
    // Convert YYYY-MM-DD → MM/DD/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-");
      return `${month}/${day}/${year}`;
    }
  
    return date;
  };

/**
 * Generate unique Request_Id
 */
const crypto = require("crypto");

const generateRequestId = () => {
  return crypto.randomUUID().toUpperCase();
};

/**
 * Build exact ETRAV UAT request body
 */
const buildEtravSearchBody = ({
    origin,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    children = 0,
    infants = 0,
    travelType = 0,
    bookingType = 0,
  }) => {
  const tripInfo = [
    {
      Origin: origin,
      Destination: destination,
      TravelDate: formatEtravDate(departureDate),
      Trip_Id: 0,
    },
  ];

  // Add return trip only when returnDate is provided
  if (returnDate) {
    tripInfo.push({
      Origin: destination,
      Destination: origin,
      TravelDate: formatEtravDate(returnDate),
      Trip_Id: 0,
    });
  }

  return {
    Auth_Header: {
        UserId: process.env.ETRAV_UAT_USERNAME,
        Password: process.env.ETRAV_UAT_PASSWORD,
        IP_Address: "127.0.0.1",
        Request_Id: generateRequestId(),
        IMEI_Number: "xxxxxxxxxx",
      },

    Travel_Type: Number(travelType), 
    Booking_Type: Number(bookingType),

    TripInfo: tripInfo,

    Adult_Count: Number(adults),
    Child_Count: Number(children),
    Infant_Count: Number(infants),

    Class_Of_Travel: 0,
    InventoryType: 0,
    Filtered_Airline: null,
  };
};

/**
 * Search flights from ETRAV UAT
 */
const searchEtravFlights = async (searchData) => {
  try {
    const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults = 1,
        children = 0,
        infants = 0,
        travelType = 0,
        bookingType = 0,
      } = searchData;

    // Basic validation
    if (!origin) {
      throw new Error("Origin is required");
    }

    if (!destination) {
      throw new Error("Destination is required");
    }

    if (!departureDate) {
      throw new Error("Departure date is required");
    }

    if (!process.env.ETRAV_UAT_USERNAME) {
      throw new Error("ETRAV_UAT_USERNAME is missing");
    }

    if (!process.env.ETRAV_UAT_PASSWORD) {
      throw new Error("ETRAV_UAT_PASSWORD is missing");
    }

    /**
     * EXACT UAT URL from working Postman
     */
    const searchUrl =
      "https://stg-api.codemagen.net/airlinehost/AirAPIService.svc/JSONService/Air_Search";

    /**
     * Exact provider body structure
     */
    const requestBody = buildEtravSearchBody({
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        travelType,
        bookingType,
      });

    console.log("\n=================================");
    console.log("ETRAV FLIGHT SEARCH");
    console.log("Environment: UAT");
    console.log("URL:", searchUrl);
    console.log("Origin:", origin);
    console.log("Destination:", destination);
    console.log("Departure:", departureDate);
    console.log("Return:", returnDate || "ONE WAY");
    console.log("Adults:", adults);
    console.log("Children:", children);
    console.log("Infants:", infants);

    // Do NOT print password
    console.log(
      "ETRAV Request Body:",
      JSON.stringify(
        {
          ...requestBody,
          Auth_Header: {
            ...requestBody.Auth_Header,
            Password: "********",
          },
        },
        null,
        2
      )
    );

    console.log("=================================\n");

    const response = await axios.post(searchUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 60000,
    });

    console.log("ETRAV RESPONSE RECEIVED");

    console.log(
      "ETRAV Error Code:",
      response.data?.Response_Header?.Error_Code
    );

    console.log(
      "ETRAV Error Description:",
      response.data?.Response_Header?.Error_Desc
    );

    console.log(
      "ETRAV Search Key:",
      response.data?.Search_Key ? "Received" : "Not Received"
    );

    console.log(
      "ETRAV Trip Details:",
      response.data?.TripDetails?.length || 0
    );

    return response.data;
  } catch (error) {
    console.error("\n=================================");
    console.error("ETRAV SEARCH ERROR");
    console.error("=================================");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Provider Response:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }

    console.error("=================================\n");

    throw new Error(
      error.response?.data?.Message ||
        error.response?.data?.Response_Header?.Error_Desc ||
        error.message ||
        "ETRAV flight search failed"
    );
  }
};

module.exports = {
  searchEtravFlights,
  buildEtravSearchBody,
  formatEtravDate,
};