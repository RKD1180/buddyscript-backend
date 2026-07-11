const express = require("express");
const router = express.Router({ mergeParams: true });
const protect = require("../middleware/auth");
const {
  addComment,
  getComments,
  deleteComment,
  likeComment,
} = require("../controllers/commentController");

router.use(protect);

router.route("/").get(getComments).post(addComment);
router.route("/:id").delete(deleteComment);
router.route("/:id/like").put(likeComment);

module.exports = router;
