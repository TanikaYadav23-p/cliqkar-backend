const express = require("express");

const {
  getMyProfile,
  updatePersonalProfile,
  updatePassword,
} = require("../../controllers/user/profileController");

const { protect,userOnly } = require("../../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// ALL PROFILE ROUTES REQUIRE LOGIN
// =====================================================

router.use(protect);
//router.use(userOnly);


// =====================================================
// GET CURRENT USER
// =====================================================

router.get("/me", getMyProfile);


// =====================================================
// UPDATE PERSONAL PROFILE
// =====================================================

router.put("/personal", updatePersonalProfile);


// =====================================================
// CHANGE PASSWORD
// =====================================================

router.put("/password", updatePassword);


module.exports = router;