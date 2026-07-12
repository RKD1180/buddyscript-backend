const { sendError } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err.message);
  console.error("STACK:", err.stack);
  
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Multer upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File is too large. Maximum size is 1MB.";
  } else if (err.message === "Only image files are allowed") {
    statusCode = 400;
  }

  sendError(res, {
    statusCode,
    message: process.env.NODE_ENV === "production" && statusCode === 500 ? "Internal server error" : message,
  });
};

module.exports = errorHandler;
