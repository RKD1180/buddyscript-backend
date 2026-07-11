const express = require("express");
const router = express.Router({ mergeParams: true });
const protect = require("../middleware/auth");
const {
  addReply,
  getReplies,
  deleteReply,
  likeReply,
} = require("../controllers/replyController");

router.use(protect);

router.route("/").get(getReplies).post(addReply);
router.route("/:id").delete(deleteReply);
router.route("/:id/like").put(likeReply);

module.exports = router;
