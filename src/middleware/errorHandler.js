const { sendError } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err.message);
  console.error("STACK:", err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  sendError(res, {
    statusCode,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};

module.exports = errorHandler;
