const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const authRoutes = require("./routes/user/authRoutes");
const userRoutes = require("./routes/admin/userlistRoutes");
const agentRoutes = require("./routes/admin/agentlistRoutes");
const airportRoutes = require("./routes/admin/airportRoutes");
const countryRoutes = require("./routes/admin/countryRoutes");
const airlineRoutes = require("./routes/admin/airlineRoutes");
const settingsRoutes = require("./routes/admin/settingsRoutes");
const contactRoutes = require("./routes/user/contactRoutes");
const supportRoutes = require("./routes/admin/supportRoutes");
const otbRoutes = require("./routes/user/otbRoutes");

const otbApplicationRoutes =
  require("./routes/admin/otbApplicationRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
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
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
