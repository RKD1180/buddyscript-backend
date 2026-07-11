const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    sendSuccess(res, { message: "Users fetched successfully", data: users });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, { statusCode: 404, message: "User not found" });
    }
    sendSuccess(res, { message: "User fetched successfully", data: user });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "User created successfully", data: user });
  } catch (error) {
    sendError(res, { statusCode: 400, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return sendError(res, { statusCode: 404, message: "User not found" });
    }
    sendSuccess(res, { message: "User updated successfully", data: user });
  } catch (error) {
    sendError(res, { statusCode: 400, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return sendError(res, { statusCode: 404, message: "User not found" });
    }
    sendSuccess(res, { message: "User deleted successfully", data: { id: req.params.id } });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
