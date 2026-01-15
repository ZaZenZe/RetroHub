'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../shared/models/User');
const UserStats = require('../../shared/models/UserStats');
const { verifyToken } = require('../../shared/middleware/auth.middleware');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'demo-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

function sanitizeUser(user) {
  return {
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

    const canSetRole = (process.env.ALLOW_ADMIN_REGISTRATION || 'false').toLowerCase() === 'true';
    const user = new User({
      email,
      username,
      passwordHash: password,
      role: canSetRole && role === 'admin' ? 'admin' : 'user',
    });
    await user.save();
    await ensureStats(user._id);

    const token = signToken(user);
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findByEmail(email);
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
    return res.json({ user: sanitizeUser(user), token });
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
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
