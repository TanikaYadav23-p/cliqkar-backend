const express = require("express");

const {
  getUsers,
  searchUsers,
  getUserById,
  deleteUser,
  getUserStats,
} = require("../../controllers/admin/userlistController");

const { protect, adminOnly } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
//router.use(adminOnly);

router.get("/", getUsers);

router.get("/stats", getUserStats);

router.post("/search", searchUsers);

router.get("/:id", getUserById);

router.delete("/:id", deleteUser);

module.exports = router;