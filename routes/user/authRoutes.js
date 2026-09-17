const express = require("express");

const {
  signup,
  signin,
  getMe,
  adminSignup,
  adminLogin,
} = require("../../controllers/user/authController");

const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);

router.post("/signin", signin);

router.get("/me", protect, getMe);

router.post("/admin/signup", adminSignup);
router.post("/admin/login", adminLogin);
module.exports = router;