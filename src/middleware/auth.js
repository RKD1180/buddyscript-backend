const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/response");

const protect = async (req, res, next) => {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return sendError(res, { statusCode: 401, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: "Not authorized, user not found" });
    }
    next();
  } catch (error) {
    return sendError(res, { statusCode: 401, message: "Not authorized, token failed" });
  }
};

module.exports = protect;
