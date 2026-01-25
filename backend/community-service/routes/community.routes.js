'use strict';

const express = require('express');
const { Types } = require('mongoose');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const Post = require('../../shared/models/Post');
const Reply = require('../../shared/models/Reply');
const Game = require('../../shared/models/Game');
const User = require('../../shared/models/User');
const UserStats = require('../../shared/models/UserStats');

const router = express.Router();

async function upsertStats(userId, inc = {}) {
  await UserStats.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId }, ...(Object.keys(inc).length ? { $inc: inc } : {}) },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function canModerateGame(userId, gameId) {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(gameId)) return false;
  const user = await User.findById(userId).lean();
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'mod' && Array.isArray(user.moderatedGames)) {
    return user.moderatedGames.some(id => id.toString() === gameId.toString());
  }
  return false;
}

router.get('/games/:gameId/posts', async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    if (!Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }
    const [posts, total] = await Promise.all([
      Post.find({ gameId })
        .populate('userId', 'username avatarUrl')
        .populate('spoilerMarkedBy', 'username')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments({ gameId }),
    ]);
    res.json({ posts, page, total });
  } catch (err) {
    next(err);
  }
});

router.post('/games/:gameId/posts', verifyToken, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { content, isSpoiler = false } = req.body || {};
    if (!Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const post = await Post.create({
      userId: req.user.sub,
      gameId,
      content: content.trim().slice(0, 2000),
      isSpoiler,
    });
    await upsertStats(req.user.sub, { forumPosts: 1 });
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:postId/replies', async (req, res, next) => {
  try {
    const { postId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    if (!Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const replies = await Reply.findByPost(postId)
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
    res.json({ replies });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:postId/replies', verifyToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body || {};
    if (!Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const reply = await Reply.create({
      postId,
      userId: req.user.sub,
      content: content.trim().slice(0, 1000),
    });
    await upsertStats(req.user.sub, { forumReplies: 1 });
    res.status(201).json({ reply });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:postId/vote', verifyToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { direction } = req.body || {};
    if (!Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (direction !== 'up' && direction !== 'down') {
      return res.status(400).json({ error: 'direction must be up or down' });
    }
    await post.applyVote(req.user.sub, direction);
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (err) {
    next(err);
  }
});

// Delete a post (owner, admin, or moderator of the game)
router.delete('/posts/:postId', verifyToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isOwner = post.userId.toString() === req.user.sub;
    const canMod = await canModerateGame(req.user.sub, post.gameId);
    if (!(isOwner || canMod)) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    await Promise.all([Post.deleteOne({ _id: postId }), Reply.deleteMany({ postId })]);
    await upsertStats(req.user.sub, { forumPosts: isOwner ? -1 : 0 });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// Delete a reply (owner, admin, or moderator of the game)
router.delete('/replies/:replyId', verifyToken, async (req, res, next) => {
  try {
    const { replyId } = req.params;
    if (!Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: 'Invalid reply id' });
    }
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    const post = await Post.findById(reply.postId);
    if (!post) {
      return res.status(404).json({ error: 'Parent post not found' });
    }
    const isOwner = reply.userId.toString() === req.user.sub;
    const canMod = await canModerateGame(req.user.sub, post.gameId);
    if (!(isOwner || canMod)) {
      return res.status(403).json({ error: 'Not authorized to delete this reply' });
    }
    await Reply.deleteOne({ _id: replyId });
    await upsertStats(req.user.sub, { forumReplies: isOwner ? -1 : 0 });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// Toggle spoiler flag on a post (owner, admin, or moderator of the game's moderators)
router.patch('/posts/:postId/spoiler', verifyToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { isSpoiler } = req.body || {};

    if (!Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isOwner = post.userId.toString() === req.user.sub;
    const canMod = await canModerateGame(req.user.sub, post.gameId);
    if (!(isOwner || canMod)) {
      return res.status(403).json({ error: 'Not authorized to modify this post' });
    }

    post.isSpoiler = !!isSpoiler;
    post.spoilerMarkedBy = post.isSpoiler ? req.user.sub : null;
    await post.save();

    const updated = await Post.findById(post._id).populate('userId', 'username avatarUrl').populate('spoilerMarkedBy', 'username');
    res.json({ post: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
