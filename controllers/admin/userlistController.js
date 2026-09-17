const User = require("../../models/user/User");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Users fetched successfully", {
      users,
      total: users.length,
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to fetch users");
  }
};

const searchUsers = async (req, res) => {
  try {
    const { name, email, number } = req.body;

    const query = {
      role: "user",
    };

    if (name && name.trim()) {
      query.fullName = {
        $regex: name.trim(),
        $options: "i",
      };
    }

    if (email && email.trim()) {
      query.email = {
        $regex: email.trim(),
        $options: "i",
      };
    }

    if (number && number.trim()) {
      query.phoneNumber = {
        $regex: number.trim(),
        $options: "i",
      };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Users searched successfully", {
      users,
      total: users.length,
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to search users");
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "user",
    }).select("-password");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "User fetched successfully", {
      user,
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to fetch user");
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "user",
    });

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    await User.findByIdAndDelete(user._id);

    return sendSuccess(res, 200, "User deleted successfully");
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to delete user");
  }
};

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({
      role: "user",
    });

    return sendSuccess(res, 200, "User statistics fetched successfully", {
      stats: {
        totalRegistered: totalUsers,
      },
    });
  } catch (error) {
    return sendError(
      res,
      500,
      error.message || "Failed to fetch user statistics"
    );
  }
};

module.exports = {
  getUsers,
  searchUsers,
  getUserById,
  deleteUser,
  getUserStats,
};