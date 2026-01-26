'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');
const User = require('../../shared/models/User');
const UserStats = require('../../shared/models/UserStats');
const { verifyToken } = require('../../shared/middleware/auth.middleware');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'demo-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const IS_DEV = process.env.NODE_ENV !== 'production';

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'user',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user, { includeModeratedGames = false, includeFavorites = false } = {}) {
  const base = {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role || 'user',
    avatarUrl: user.avatarUrl,
    level: user.level,
    experiencePoints: user.experiencePoints,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
  if (includeModeratedGames) {
    base.moderatedGames = (user.moderatedGames || []).map(id => id.toString());
  }
  if (includeFavorites) {
    base.favoriteGames = (user.favoriteGames || []).map(id => id.toString());
  }
  return base;
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

async function ensureStats(userId) {
  await UserStats.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password, role } = req.body || {};
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'email or username already in use' });
    }

    const allowedAdminValues = new Set(['true', '1', 'yes']);
    const canSetRole = allowedAdminValues.has(
      String(process.env.ALLOW_ADMIN_REGISTRATION || 'false').toLowerCase()
    );
    const user = new User({
      email,
      username,
      passwordHash: password,
      role: canSetRole && role === 'admin' ? 'admin' : 'user',
    });
    await user.save();
    await ensureStats(user._id);

    if (user.role === 'admin') {
      console.warn(`[audit] Admin account created: ${user.email}`);
    }

    const token = signToken(user);
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    // Handle duplicate key errors explicitly
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email or username already in use' });
    }
    console.error('[auth] register failed', err);
    return res.status(500).json({
      error: 'Registration failed',
      detail: IS_DEV ? err.message || err.toString() : undefined,
    });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const identifier = typeof email === 'string' ? email.trim() : '';
    if (!identifier || !password) {
      return res.status(400).json({ error: 'email/username and password are required' });
    }
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    });
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();
    await ensureStats(user._id);

    const token = signToken(user);
    return res.json({ user: sanitizeUser(user, { includeModeratedGames: true, includeFavorites: true }), token });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

router.get('/validate', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // include favorites so client has canonical list on validate
    return res.json({ user: sanitizeUser(user, { includeModeratedGames: true, includeFavorites: true }) });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: sanitizeUser(user, { includeModeratedGames: true, includeFavorites: true }) });
  } catch (err) {
    return next(err);
  }
});

// Admin: change user role
router.post('/admin/users/:id/role', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const allowedRoles = ['user', 'mod', 'admin'];
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'role must be user | mod | admin' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.role = role;
    await user.save();
    return res.json({ user: sanitizeUser(user, { includeModeratedGames: true }) });
  } catch (err) {
    return next(err);
  }
});

// Admin: add a moderated game to a moderator
router.post(
  '/admin/users/:id/moderated-games',
  verifyToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { gameId } = req.body || {};
      if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(gameId)) {
        return res.status(400).json({ error: 'Invalid id(s)' });
      }
      const user = await User.findByIdAndUpdate(
        id,
        { $addToSet: { moderatedGames: gameId }, $set: { role: 'mod' } },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user: sanitizeUser(user, { includeModeratedGames: true }) });
    } catch (err) {
      return next(err);
    }
  }
);

// Admin: remove a moderated game assignment
router.delete(
  '/admin/users/:id/moderated-games/:gameId',
  verifyToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id, gameId } = req.params;
      if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(gameId)) {
        return res.status(400).json({ error: 'Invalid id(s)' });
      }
      const user = await User.findByIdAndUpdate(
        id,
        { $pull: { moderatedGames: gameId } },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user: sanitizeUser(user, { includeModeratedGames: true }) });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
