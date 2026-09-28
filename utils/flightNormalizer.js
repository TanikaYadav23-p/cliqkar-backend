const calculateDuration = (start, end) => {
    if (!start || !end) return null;
  
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
  
      const diffMs = endDate - startDate;
  
      if (Number.isNaN(diffMs) || diffMs < 0) {
        return null;
      }
  
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
  
      const hours = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, "0");
  
      const minutes = (totalMinutes % 60)
        .toString()
        .padStart(2, "0");
  
      return `${hours}:${minutes}`;
    } catch (error) {
      return null;
    }
  };
  
  const normalizeEtravResponse = (data) => {
    const flights = [];
  
    const tripDetails = data?.TripDetails || [];
  
    tripDetails.forEach((trip) => {
      const tripFlights = trip?.Flights || [];
  
      tripFlights.forEach((flight) => {
        const segments = (flight?.Segments || []).map((segment) => ({
          origin: segment?.Origin || null,
          destination: segment?.Destination || null,
  
          flight_number: segment?.Flight_Number
            ? `${segment?.Airline_Code || ""} ${segment.Flight_Number}`
                .replace(/\s+/g, " ")
                .trim()
            : null,
  
          airline_code: segment?.Airline_Code || null,
          airline_name: segment?.Airline_Name || null,
  
          departure_datetime: segment?.Departure_DateTime || null,
          arrival_datetime: segment?.Arrival_DateTime || null,
  
          departure_terminal: segment?.Origin_Terminal || null,
          arrival_terminal: segment?.Destination_Terminal || null,
  
          duration: segment?.Duration || null,
  
          aircraft_type: segment?.Aircraft_Type || null,
  
          origin_city: segment?.Origin_City || null,
          destination_city: segment?.Destination_City || null,
        }));
  
        const fares = flight?.Fares || [];
  
        fares.forEach((fare) => {
          const fareDetails = fare?.FareDetails?.[0] || {};
  
          const fareClass = fareDetails?.FareClasses?.[0] || {};
  
          const baggage = fareDetails?.Free_Baggage || {};
  
          const firstSegment = segments[0];
          const lastSegment = segments[segments.length - 1];
  
          const flightData = {
            // Provider
            provider: "etrav",
  
            // Trip
            trip_id: trip?.Trip_Id || null,
  
            // Flight identification
            flight_id: flight?.Flight_Id || null,
            flight_key: flight?.Flight_Key || null,
  
            // Route
            origin:
              flight?.Origin ||
              firstSegment?.origin ||
              null,
  
            destination:
              flight?.Destination ||
              lastSegment?.destination ||
              null,
  
            // Airline
            airline_code: flight?.Airline_Code || null,
  
            airline_name:
              flight?.Airline_Name ||
              firstSegment?.airline_name ||
              null,
  
            // Flight numbers
            flight_numbers:
              segments
                .map((segment) => segment.flight_number)
                .filter(Boolean),
  
            // Timing
            departure_datetime:
              firstSegment?.departure_datetime || null,
  
            arrival_datetime:
              lastSegment?.arrival_datetime || null,
  
            duration:
              segments.length === 1
                ? segments[0]?.duration || null
                : calculateDuration(
                    firstSegment?.departure_datetime,
                    lastSegment?.arrival_datetime
                  ),
  
            // Fare
            price:
              fareDetails?.Total_Amount !== undefined
                ? Number(fareDetails.Total_Amount)
                : null,
  
            basic_amount:
              fareDetails?.Basic_Amount !== undefined
                ? Number(fareDetails.Basic_Amount)
                : null,
  
            airport_tax:
              fareDetails?.AirportTax_Amount !== undefined
                ? Number(fareDetails.AirportTax_Amount)
                : null,
  
            currency: fareDetails?.Currency_Code || "INR",
  
            // Fare information
            fare_type:
              fareClass?.Class_Desc ||
              fare?.FareType ||
              null,
  
            fare_id: fare?.Fare_Id || null,
  
            fare_key: fare?.Fare_Key || null,
  
            fare_basis:
              fareClass?.FareBasis || null,
  
            class_code:
              fareClass?.Class_Code || null,
  
            cabin_class:
              fareClass?.CabinClass || null,
  
            // Booking information
            refundable:
              fare?.Refundable !== undefined
                ? fare.Refundable
                : null,
  
            seats_available:
              fare?.Seats_Available !== undefined
                ? Number(fare.Seats_Available)
                : null,
  
            last_few_seats:
              fare?.LastFewSeats !== undefined
                ? fare.LastFewSeats
                : null,
  
            // Baggage
            baggage: {
              check_in:
                baggage?.Check_In_Baggage || null,
  
              hand:
                baggage?.Hand_Baggage || null,
  
              display_remarks:
                baggage?.DisplayRemarks || null,
            },
  
            // Segments
            segments,
  
            stopovers:
              Math.max(segments.length - 1, 0),
  
            // Important for booking/rules later
            search_key:
              data?.Search_Key || null,
  
            // Keep provider data internally available
            raw_flight: flight,
  
            raw_fare: fare,
          };
  
          flights.push(flightData);
        });
      });
    });
  
    return {
      search_key: data?.Search_Key || null,
      total_flights: flights.length,
      flights,
    };
  };
  
  module.exports = normalizeEtravResponse;