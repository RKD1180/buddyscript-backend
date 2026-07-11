const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  likePost,
} = require("../controllers/postController");

router.use(protect);

router.route("/").get(getFeed).post(upload.single("image"), createPost);
router.route("/:id").get(getPostById).delete(deletePost);
router.route("/:id/like").put(likePost);

module.exports = router;
