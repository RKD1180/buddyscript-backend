const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Reply = require("../models/Reply");
const { sendSuccess, sendError } = require("../utils/response");

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return sendError(res, { statusCode: 404, message: "Post not found" });
    }

    if (
      post.visibility === "private" &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return sendError(res, { statusCode: 403, message: "Not authorized" });
    }

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      text,
    });

    const populated = await comment.populate("author", "firstName lastName email");

    sendSuccess(res, {
      statusCode: 201,
      message: "Comment added successfully",
      data: populated,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "firstName lastName email")
      .populate("likes", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const commentsWithDetails = comments.map((comment) => ({
      ...comment,
      isLiked: comment.likes.some(
        (like) => like._id.toString() === req.user._id.toString()
      ),
    }));

    const total = await Comment.countDocuments({ post: req.params.postId });

    sendSuccess(res, {
      message: "Comments fetched successfully",
      data: {
        comments: commentsWithDetails,
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return sendError(res, { statusCode: 404, message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return sendError(res, { statusCode: 403, message: "Not authorized" });
    }

    await Reply.deleteMany({ comment: comment._id });
    await comment.deleteOne();

    sendSuccess(res, {
      message: "Comment deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return sendError(res, { statusCode: 404, message: "Comment not found" });
    }

    const alreadyLiked = comment.likes.includes(req.user._id);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();
    const populated = await comment.populate("likes", "firstName lastName");

    sendSuccess(res, {
      message: alreadyLiked ? "Comment unliked" : "Comment liked",
      data: { likes: populated.likes, isLiked: !alreadyLiked },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

module.exports = { addComment, getComments, deleteComment, likeComment };
