const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");
const { sendSuccess } = require("./src/utils/response");

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/posts", require("./src/routes/postRoutes"));
app.use("/api/posts/:postId/comments", require("./src/routes/commentRoutes"));
app.use("/api/comments/:commentId/replies", require("./src/routes/replyRoutes"));
app.use("/api/feed", require("./src/routes/feedRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));

app.get("/", (req, res) => {
  sendSuccess(res, { message: "Welcome to Social Backend API" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
