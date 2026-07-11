const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Reply = require("../models/Reply");
const { sendSuccess, sendError } = require("../utils/response");

const createPost = async (req, res) => {
  try {
    const { text, visibility } = req.body;

    if (!text && !req.file) {
      return sendError(res, { statusCode: 400, message: "Please add text or an image to your post" });
    }

    const postData = {
      author: req.user._id,
      text: text || "",
      visibility: visibility || "public",
    };

    if (req.file) {
      postData.image = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create(postData);
    const populated = await post.populate("author", "firstName lastName email");

    sendSuccess(res, {
      statusCode: 201,
      message: "Post created successfully",
      data: populated,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      $or: [{ visibility: "public" }, { author: req.user._id }],
    })
      .populate("author", "firstName lastName email")
      .populate("likes", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post,
          commentCount,
          isLiked: post.likes.some(
            (like) => like._id.toString() === req.user._id.toString()
          ),
        };
      })
    );

    const total = await Post.countDocuments({
      $or: [{ visibility: "public" }, { author: req.user._id }],
    });

    sendSuccess(res, {
      message: "Feed fetched successfully",
      data: {
        posts: postsWithDetails,
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "firstName lastName email")
      .populate("likes", "firstName lastName");

    if (!post) {
      return sendError(res, { statusCode: 404, message: "Post not found" });
    }

    if (
      post.visibility === "private" &&
      post.author._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, { statusCode: 403, message: "Not authorized" });
    }

    const comments = await Comment.find({ post: post._id })
      .populate("author", "firstName lastName email")
      .populate("likes", "firstName lastName")
      .sort({ createdAt: -1 });

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Reply.find({ comment: comment._id })
          .populate("author", "firstName lastName email")
          .populate("likes", "firstName lastName")
          .sort({ createdAt: -1 });

        return {
          ...comment.toObject(),
          replies,
          isLiked: comment.likes.some(
            (like) => like._id.toString() === req.user._id.toString()
          ),
        };
      })
    );

    sendSuccess(res, {
      message: "Post fetched successfully",
      data: {
        ...post.toObject(),
        comments: commentsWithReplies,
        isLiked: post.likes.some(
          (like) => like._id.toString() === req.user._id.toString()
        ),
      },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendError(res, { statusCode: 404, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return sendError(res, { statusCode: 403, message: "Not authorized" });
    }

    const comments = await Comment.find({ post: post._id }).select("_id");
    await Reply.deleteMany({ comment: { $in: comments.map((c) => c._id) } });
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    sendSuccess(res, { message: "Post deleted successfully", data: { id: req.params.id } });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendError(res, { statusCode: 404, message: "Post not found" });
    }

    if (
      post.visibility === "private" &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return sendError(res, { statusCode: 403, message: "Not authorized" });
    }

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    const populated = await post.populate("likes", "firstName lastName");

    sendSuccess(res, {
      message: alreadyLiked ? "Post unliked" : "Post liked",
      data: { likes: populated.likes, isLiked: !alreadyLiked },
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: error.message });
  }
};

module.exports = { createPost, getFeed, getPostById, deletePost, likePost };
