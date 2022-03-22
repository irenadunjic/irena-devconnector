const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const { json } = require('express/lib/response');

// @route  POST api/posts
// @desc   Create a post
// @access Private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Import current user information, minus the password
    try {
      const user = await User.findById(req.user.id).select("-password");

      // Create a new post object
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      // Save new post
      const post = await newPost.save();
      // Return new post in response
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).status("Server Error");
    }
  }
);

// @route  GET api/posts
// @desc   Get all posts
// @access Private
router.get("/", auth, async (req, res) => {
  try {
    // Sort all posts by date, with newest first
    // Default would be with oldest first
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).status("Server Error");
  }
});

// @route  GET api/posts/:id
// @desc   Get post by ID
// @access Private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if current post doesn't exist
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Return current post
    res.json(post);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.status(500).status("Server error");
  }
});

// @route  DELETE api/posts/:id
// @desc   Delete a post
// @access Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Remove post
    await post.remove();
    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Post not found" });
    }

    res.status(500).status("Server Error");
  }
});

// @route  PUT api/posts/like/:id
// @desc   Like a post
// @access Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (post.likes.filter((like) => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    // Add current user to post's likes array
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.status(500).status("Server Error");
  }
});

// @route  PUT api/posts/unlike/:id
// @desc   Unike a post
// @access Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has not been liked yet
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length == 0
    ) {
      return res.status(400).json({ msg: "Post not yet liked" });
    }

    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    // Remove current user from post's likes array
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.status(500).status("Server Error");
  }
});

// @route  POST api/posts/comment/:id
// @desc   Comment on a post
// @access Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Import current user information, minus the password
    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      // Create a new post object
      const newComment = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      // Add new comment to post's comments array
      post.comments.unshift(newComment);
      // Save new comment on post
      await post.save();
      // Return all of post's comments in response
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).status("Server Error");
    }
  }
);

// @route  DELETE api/posts/comment/:id/:comment_id
// @desc   Delete a comment from a post
// @access Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    // Make sure user deleting comment is user who made comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Get remove index
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    // Remove current user from post's likes array
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).status("Server Error");
  }
});


module.exports = router;