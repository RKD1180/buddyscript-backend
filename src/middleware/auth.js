const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/response");

const protect = async (req, res, next) => {
  let token = req.cookies && req.cookies.token;

  // Fallback: check Authorization header (Bearer token)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

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
