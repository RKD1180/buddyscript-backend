const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getFeed } = require("../controllers/postController");

router.get("/", protect, getFeed);

module.exports = router;
