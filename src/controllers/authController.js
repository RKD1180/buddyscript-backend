const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return sendError(res, { statusCode: 400, message: "All fields are required (firstName, lastName, email, password)" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, { statusCode: 400, message: "User already exists" });
    }

    const user = await User.create({ firstName, lastName, email, password });

    sendSuccess(res, {
      statusCode: 201,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, { statusCode: 400, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendError(res, { statusCode: 401, message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, { statusCode: 401, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    sendSuccess(res, {
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
    path: "/",
  });
  sendSuccess(res, { message: "Logged out successfully" });
};

const getMe = async (req, res) => {
  sendSuccess(res, {
    message: "User fetched successfully",
    data: req.user,
  });
};

module.exports = { register, login, logout, getMe };
