const jwt = require("jsonwebtoken");
const User = require("../models/user/User");
const { sendError } = require("../helpers/apiResponse");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return sendError(res, 401, "User no longer exists");
      }

      req.user = { id: user._id, role: user.role };
      return next();
    } catch (error) {
      return sendError(res, 401, "Not authorized, invalid or expired token");
    }
  }

  return sendError(res, 401, "Not authorized, no token provided");
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return sendError(res, 403, "Access denied, admin only");
};

module.exports = { protect, adminOnly };
