const {
    searchEtravFlights,
  } = require("../../services/flight/etravService");
  
  const Airport = require("../../models/admin/airport");
  
  const normalizeEtravResponse = require("../../utils/flightNormalizer");
  
  const { sendSuccess } = require("../../helpers/apiResponse");
  
  const searchFlights = async (req, res, next) => {
    try {
      console.log("========== FLIGHT SEARCH ==========");
  
      const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults = 1,
        children = 0,
        infants = 0,
        tripType = "One way",
      } = req.body;

      const bookingType =
  tripType === "Round-trip" ? 1 : 0;
  
      console.log("SEARCH DATA:", {
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        tripType,
      });
  
      // ==========================================
      // 1. FIND ORIGIN AIRPORT
      // ==========================================
  
      const originAirport = await Airport.findOne({
        airportCode: String(origin || "").toUpperCase(),
        status: "Active",
      });
  
      // ==========================================
      // 2. FIND DESTINATION AIRPORT
      // ==========================================
  
      const destinationAirport = await Airport.findOne({
        airportCode: String(destination || "").toUpperCase(),
        status: "Active",
      });
  
      // ==========================================
      // 3. VALIDATE ORIGIN
      // ==========================================
  
      if (!originAirport) {
        return res.status(400).json({
          success: false,
          message: `Origin airport ${origin} not found`,
        });
      }
  
      // ==========================================
      // 4. VALIDATE DESTINATION
      // ==========================================
  
      if (!destinationAirport) {
        return res.status(400).json({
          success: false,
          message: `Destination airport ${destination} not found`,
        });
      }
  
      // ==========================================
      // 5. DETERMINE DOMESTIC / INTERNATIONAL
      // ==========================================
  
      let travelType = 0;
  
      if (
        originAirport.countryCode &&
        destinationAirport.countryCode
      ) {
        travelType =
          originAirport.countryCode.toUpperCase() ===
          destinationAirport.countryCode.toUpperCase()
            ? 0
            : 1;
      }
  
      console.log(
        "TRAVEL TYPE:",
        travelType === 0 ? "DOMESTIC" : "INTERNATIONAL"
      );
  
      // ==========================================
      // 6. CALL ETRAV
      // ==========================================
  
      const providerResponse = await searchEtravFlights({
        origin: String(origin).toUpperCase(),
        destination: String(destination).toUpperCase(),
        departureDate,
        returnDate: tripType === "Round-trip" ? returnDate : null,
        adults: Number(adults),
        children: Number(children),
        infants: Number(infants),
        travelType,
        bookingType,
      });
  
      // ==========================================
      // 7. NORMALIZE ETRAV RESPONSE
      // ==========================================
  
      const normalizedData =
        normalizeEtravResponse(providerResponse);
  
      console.log(
        "ETRAV TOTAL FLIGHTS:",
        normalizedData.total_flights
      );
  
      // ==========================================
      // 8. SEND RESPONSE
      // ==========================================
  
      return sendSuccess(
        res,
        200,
        "Flight search successful",
        normalizedData
      );
    } catch (error) {
      console.error(
        "FLIGHT SEARCH CONTROLLER ERROR:",
        error.message
      );
  
      next(error);
    }
  };
  
  module.exports = {
    searchFlights,
  };