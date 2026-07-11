const Comment = require("../models/Comment");
const Reply = require("../models/Reply");
const { sendSuccess, sendError } = require("../utils/response");

const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return sendError(res, { statusCode: 404, message: "Comment not found" });
    }

    const reply = await Reply.create({
      comment: req.params.commentId,
      author: req.user._id,
      text,
    });

    const populated = await reply.populate("author", "firstName lastName email");

    sendSuccess(res, {
      statusCode: 201,
      message: "Reply added successfully",
      data: populated,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const getReplies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const replies = await Reply.find({ comment: req.params.commentId })
      .populate("author", "firstName lastName email")
      .populate("likes", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const repliesWithDetails = replies.map((reply) => ({
      ...reply,
      isLiked: reply.likes.some(
        (like) => like._id.toString() === req.user._id.toString()
      ),
    }));

    const total = await Reply.countDocuments({ comment: req.params.commentId });

    sendSuccess(res, {
      message: "Replies fetched successfully",
      data: {
        replies: repliesWithDetails,
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const deleteReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);

    if (!reply) {
      return sendError(res, { statusCode: 404, message: "Reply not found" });
    }

    if (reply.author.toString() !== req.user._id.toString()) {
      return sendError(res, { statusCode: 403, message: "Not authorized" });
    }

    await reply.deleteOne();

    sendSuccess(res, {
      message: "Reply deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const likeReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);

    if (!reply) {
      return sendError(res, { statusCode: 404, message: "Reply not found" });
    }

    const alreadyLiked = reply.likes.includes(req.user._id);

    if (alreadyLiked) {
      reply.likes = reply.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      reply.likes.push(req.user._id);
    }

    await reply.save();
    const populated = await reply.populate("likes", "firstName lastName");

    sendSuccess(res, {
      message: alreadyLiked ? "Reply unliked" : "Reply liked",
      data: { likes: populated.likes, isLiked: !alreadyLiked },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

module.exports = { addReply, getReplies, deleteReply, likeReply };
