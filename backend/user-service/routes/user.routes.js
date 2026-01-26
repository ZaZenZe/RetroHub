'use strict';

const express = require('express');
const { Types } = require('mongoose');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const User = require('../../shared/models/User');
const UserStats = require('../../shared/models/UserStats');
const Achievement = require('../../shared/models/Achievement');
const UserGame = require('../../shared/models/UserGame');
const Game = require('../../shared/models/Game');
const Post = require('../../shared/models/Post');

const router = express.Router();
const allowedStatuses = ['PLAYING', 'COMPLETED', 'BACKLOG', 'WISH_LIST'];

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
    favoriteGames: (user.favoriteGames || []).map(id => id.toString()),
  };
}

async function ensureStats(userId) {
  return UserStats.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function recalcStats(userId) {
  const [games, achievementsCount] = await Promise.all([
    UserGame.find({ userId }).lean(),
    Achievement.countDocuments({ userId }),
  ]);
  const totalGames = games.length;
  const completedGames = games.filter(g => g.status === 'COMPLETED').length;

  const stats = await UserStats.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId },
      $set: { totalGames, completedGames, achievementsCount },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return stats;
}

const achievementCatalog = {
  FIRST_GAME: {
    description: 'Added your first game to the collection',
    iconUrl: 'https://static.retrohub.local/achievements/first-game.png',
    pointsValue: 10,
  },
  FIVE_GAMES: {
    description: 'Added five games to the collection',
    iconUrl: 'https://static.retrohub.local/achievements/five-games.png',
    pointsValue: 25,
  },
  TEN_GAMES: {
    description: 'Added ten games to the collection',
    iconUrl: 'https://static.retrohub.local/achievements/ten-games.png',
    pointsValue: 50,
  },
  COMPLETIONIST: {
    description: 'Completed at least three games',
    iconUrl: 'https://static.retrohub.local/achievements/completionist.png',
    pointsValue: 40,
  },
};

async function maybeUnlockCollectionAchievements(userId, statsSnapshot) {
  const unlocks = [];
  if (statsSnapshot.totalGames >= 1) unlocks.push('FIRST_GAME');
  if (statsSnapshot.totalGames >= 5) unlocks.push('FIVE_GAMES');
  if (statsSnapshot.totalGames >= 10) unlocks.push('TEN_GAMES');
  if (statsSnapshot.completedGames >= 3) unlocks.push('COMPLETIONIST');

  if (!unlocks.length) return null;
  const tasks = unlocks.map(name =>
    Achievement.unlockForUser(
      userId,
      name,
      achievementCatalog[name] || { description: name, iconUrl: '', pointsValue: 0 }
    )
  );
  await Promise.all(tasks);
  return tasks.length;
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
    // expose human-friendly totalPlayTime in hours (1 decimal)
    const totalPlayTime = Math.round(((stats.totalPlaySeconds || 0) / 3600) * 10) / 10;
    return res.json({ stats: { ...stats.toObject(), totalPlayTime } });
  } catch (err) {
    return next(err);
  }
});

// Accept a session heartbeat (seconds) to accumulate play time
router.post('/users/:id/session', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const { seconds = 0 } = req.body || {};
    const inc = Math.max(0, Math.floor(Number(seconds) || 0));
    if (!inc) return res.status(400).json({ error: 'seconds > 0 required' });
    const stats = await UserStats.findOneAndUpdate(
      { userId: req.params.id },
      { $inc: { totalPlaySeconds: inc } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const totalPlayTime = Math.round(((stats.totalPlaySeconds || 0) / 3600) * 10) / 10;
    return res.json({ stats: { ...stats.toObject(), totalPlayTime } });
  } catch (err) {
    return next(err);
  }
});

// Toggle favorite game for the user
router.patch('/users/:id/favorites', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const { gameId, action = 'add' } = req.body || {};
    if (!gameId || !Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'valid gameId required' });
    }
    const update = action === 'remove' ? { $pull: { favoriteGames: gameId } } : { $addToSet: { favoriteGames: gameId } };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { id: user._id.toString(), favoriteGames: (user.favoriteGames || []).map(g => g.toString()) } });
  } catch (err) {
    return next(err);
  }
});

// Last posts by user (with game info)
router.get('/users/:id/last-posts', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const posts = await Post.find({ userId: req.params.id })
      .populate('gameId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    return res.json({ posts });
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

router.get('/users/:id/games', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const games = await UserGame.find({ userId: req.params.id })
      .populate('gameId')
      .sort({ addedDate: -1 });
    return res.json({ games });
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
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const existing = await UserGame.findOne({ userId: req.params.id, gameId });
    const userGame = await UserGame.findOneAndUpdate(
      { userId: req.params.id, gameId },
      { $set: { status, progressPercentage: Math.min(Math.max(progressPercentage, 0), 100) } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    ).populate('gameId');

    await recalcStats(req.params.id);
    await maybeUnlockCollectionAchievements(req.params.id, {
      totalGames: (await UserGame.countDocuments({ userId: req.params.id })) || 0,
      completedGames: await UserGame.countDocuments({ userId: req.params.id, status: 'COMPLETED' }),
    });
    const stats = await recalcStats(req.params.id);
    const statusCode = existing ? 200 : 201;
    return res.status(statusCode).json({ userGame, stats });
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
    const stats = await recalcStats(req.params.id);
    return res.json({ removed: result.deletedCount > 0, stats });
  } catch (err) {
    return next(err);
  }
});

router.put('/users/:id/games/:gameId', verifyToken, async (req, res, next) => {
  if (!ensureSelf(req, res)) return;
  try {
    const { gameId } = req.params;
    const { status, progressPercentage } = req.body || {};
    if (!Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'valid gameId is required' });
    }
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    const updates = {};
    if (status) updates.status = status;
    if (progressPercentage !== undefined) {
      updates.progressPercentage = Math.min(Math.max(progressPercentage, 0), 100);
    }
    const userGame = await UserGame.findOneAndUpdate(
      { userId: req.params.id, gameId },
      { $set: updates },
      { new: true }
    ).populate('gameId');

    if (!userGame) {
      return res.status(404).json({ error: 'Entry not found for this user/game' });
    }

    await recalcStats(req.params.id);
    await maybeUnlockCollectionAchievements(req.params.id, {
      totalGames: (await UserGame.countDocuments({ userId: req.params.id })) || 0,
      completedGames: await UserGame.countDocuments({ userId: req.params.id, status: 'COMPLETED' }),
    });
    const stats = await recalcStats(req.params.id);
    return res.json({ userGame, stats });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
