const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const authRoutes = require("./routes/user/authRoutes");
const agentAuthRoutes = require("./routes/agent/agentAuthRoutes");
const agentProfileRoutes = require("./routes/agent/agentProfileRoutes");
const agentBookingRoutes = require("./routes/agent/agentBookingRoutes");
const agentWalletRoutes = require("./routes/agent/agentWalletRoutes");
const agentVisaRoutes = require("./routes/agent/agentVisaRoutes");

const userRoutes = require("./routes/admin/userlistRoutes");
const agentRoutes = require("./routes/admin/agentlistRoutes");
const airportRoutes = require("./routes/admin/airportRoutes");
const countryRoutes = require("./routes/admin/countryRoutes");
const airlineRoutes = require("./routes/admin/airlineRoutes");
const settingsRoutes = require("./routes/admin/settingsRoutes");
const contactRoutes = require("./routes/user/contactRoutes");
const supportRoutes = require("./routes/admin/supportRoutes");
const otbRoutes = require("./routes/user/otbRoutes");
const profileRoutes = require("./routes/user/profileRoutes");
const visaRoutes = require("./routes/admin/visaRoutes");
const documentRoutes = require("./routes/documents/documentRoutes");
const paymentRoutes = require("./routes/payment/paymentRoutes");
const flightSearchRoutes =
  require("./routes/flight/flightSearchRoutes");
const visaApplicationRoutes =
  require("./routes/user/visaApplicationRoutes");

const adminVisaApplicationRoutes =
  require("./routes/admin/visaApplicationRoutes");

const otbApplicationRoutes =
  require("./routes/admin/otbApplicationRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
console.log("BACKEND_URL:", process.env.BACKEND_URL);
console.log("EASEBUZZ_ENV:", process.env.EASEBUZZ_ENV);
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Cliqkar backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth/agent",agentAuthRoutes);
app.use("/api/agent/profile", agentProfileRoutes);
app.use("/api/agent/bookings", agentBookingRoutes);
app.use("/api/agent/wallet", agentWalletRoutes);
app.use("/api/agent/visa", agentVisaRoutes);

app.use("/api/users", userRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/airports", airportRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/admin/settings",settingsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/support-tickets", supportRoutes);
app.use("/api/otb",otbRoutes);
app.use("/api/admin/otb-applications",otbApplicationRoutes);
app.use("/api/user/profile", profileRoutes);
app.use("/api/visas", visaRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/payment", paymentRoutes);
app.use(
  "/api/flights",
  flightSearchRoutes
);

app.use(
  "/api/visa-applications",
  visaApplicationRoutes
);

app.use(
  "/api/admin/visa-applications",
  adminVisaApplicationRoutes
);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
