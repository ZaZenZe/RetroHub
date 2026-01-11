'use strict';

const express = require('express');
const { Types } = require('mongoose');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const Post = require('../../shared/models/Post');
const Reply = require('../../shared/models/Reply');
const Game = require('../../shared/models/Game');
const UserStats = require('../../shared/models/UserStats');

const router = express.Router();

async function upsertStats(userId, inc = {}) {
  await UserStats.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId }, ...(Object.keys(inc).length ? { $inc: inc } : {}) },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

router.get('/games/:gameId/posts', async (req, res, next) => {
  try {
    const { gameId } = req.params;
    if (!Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }
    const posts = await Post.find({ gameId })
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ posts });
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
    if (!Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const replies = await Reply.findByPost(postId)
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: 1 })
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
    if (direction === 'up') {
      await post.upvote();
    } else if (direction === 'down') {
      await post.downvote();
    } else {
      return res.status(400).json({ error: 'direction must be up or down' });
    }
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
