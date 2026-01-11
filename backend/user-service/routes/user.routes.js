'use strict';

const express = require('express');
const { Types } = require('mongoose');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const User = require('../../shared/models/User');
const UserStats = require('../../shared/models/UserStats');
const Achievement = require('../../shared/models/Achievement');
const UserGame = require('../../shared/models/UserGame');
const Game = require('../../shared/models/Game');

const router = express.Router();

function ensureSelf(req, res) {
  if (!req.user || req.user.sub !== req.params.id) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    level: user.level,
    experiencePoints: user.experiencePoints,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

async function ensureStats(userId) {
  return UserStats.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

router.get('/users/:id', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
});

router.put('/users/:id', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const updates = {};
    if (req.body.avatarUrl !== undefined) {
      updates.avatarUrl = (req.body.avatarUrl || '').trim();
    }
    if (req.body.username) {
      updates.username = req.body.username.trim();
    }
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ error: 'password must be at least 6 characters' });
      }
      updates.passwordHash = req.body.password;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    Object.assign(user, updates);
    await user.save();
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'username already in use' });
    }
    return next(err);
  }
});

router.get('/users/:id/stats', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const stats = await ensureStats(req.params.id);
    return res.json({ stats });
  } catch (err) {
    return next(err);
  }
});

router.get('/users/:id/achievements', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const achievements = await Achievement.findByUser(req.params.id);
    return res.json({ achievements });
  } catch (err) {
    return next(err);
  }
});

router.post('/users/:id/games', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const { gameId, status = 'BACKLOG', progressPercentage = 0 } = req.body || {};
    if (!gameId || !Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'valid gameId is required' });
    }
    const allowedStatuses = ['PLAYING', 'COMPLETED', 'BACKLOG', 'WISH_LIST'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const result = await UserGame.findOneAndUpdate(
      { userId: req.params.id, gameId },
      { $set: { status, progressPercentage: Math.min(Math.max(progressPercentage, 0), 100) } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    await ensureStats(req.params.id);
    return res.status(201).json({ userGame: result });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Game already added for this user' });
    }
    return next(err);
  }
});

router.delete('/users/:id/games/:gameId', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const { gameId } = req.params;
    if (!Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'valid gameId is required' });
    }
    const result = await UserGame.deleteOne({ userId: req.params.id, gameId });
    return res.json({ removed: result.deletedCount > 0 });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
