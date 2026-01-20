'use strict';

const express = require('express');
const { Types } = require('mongoose');
const Game = require('../../shared/models/Game');
const Tip = require('../../shared/models/Tip');
const FAQ = require('../../shared/models/FAQ');
const User = require('../../shared/models/User');
const { verifyToken } = require('../../shared/middleware/auth.middleware');

const router = express.Router();

const DEFAULT_THEME = {
  name: 'retro',
  colors: {
    primary: '#ff7b00',
    primaryAlt: '#ff9f1a',
    accent: '#4fc3f7',
    background: '#0d0e12',
    card: '#1b1f29',
    text: '#e6e6e9',
    border: '#232734',
  },
};

function normalizeTheme(input, fallback = DEFAULT_THEME) {
  if (!input) return { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors } };
  if (typeof input === 'string') {
    return { ...DEFAULT_THEME, colors: { ...DEFAULT_THEME.colors }, name: input.trim() || DEFAULT_THEME.name };
  }

  const base = typeof fallback === 'object' ? fallback : DEFAULT_THEME;
  const name = (input.name || base.name || DEFAULT_THEME.name || '').trim() || 'retro';
  const colors = {
    ...DEFAULT_THEME.colors,
    ...(base.colors || {}),
    ...(input.colors || {}),
  };

  return { name, colors };
}

function isObjectId(value) {
  return Types.ObjectId.isValid(value);
}

async function findGameByParam(param) {
  const query = isObjectId(param) ? { _id: param } : { slug: param };
  return Game.findOne(query);
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
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

function sanitizeGame(doc) {
  if (!doc) return null;
  const g = doc.toObject({ versionKey: false });
  g.id = g._id.toString();
  g.theme = normalizeTheme(g.theme);
  return g;
}

router.get('/games', async (req, res, next) => {
  try {
    const { q, platform } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const minYear = parseInt(req.query.minYear, 10);
    const maxYear = parseInt(req.query.maxYear, 10);

    const filter = {};
    if (q) filter.title = new RegExp(q, 'i');
    if (platform) filter.platform = platform;
    if (!Number.isNaN(minYear) || !Number.isNaN(maxYear)) {
      filter.releaseYear = {};
      if (!Number.isNaN(minYear)) filter.releaseYear.$gte = minYear;
      if (!Number.isNaN(maxYear)) filter.releaseYear.$lte = maxYear;
    }
    const [games, total] = await Promise.all([
      Game.find(filter)
        .sort({ releaseYear: -1, title: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Game.countDocuments(filter),
    ]);
    res.json({
      games: games.map(g => ({
        ...g,
        id: g._id?.toString(),
        theme: normalizeTheme(g.theme),
      })),
      page,
      total,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/games/:gameParam', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json({ game: sanitizeGame(game) });
  } catch (err) {
    next(err);
  }
});

router.get('/games/:gameParam/full', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const [tips, faqs] = await Promise.all([
      Tip.find({ gameId: game._id }).lean(),
      FAQ.find({ gameId: game._id }).lean(),
    ]);
    res.json({
      game: sanitizeGame(game),
      tips: tips.map(t => ({ id: t._id.toString(), content: t.content, category: t.category })),
      faqs: faqs.map(f => ({
        id: f._id.toString(),
        question: f.question,
        answer: f.answer,
        views: f.views,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/games/:gameParam/tips', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const tips = await Tip.find({ gameId: game._id }).lean();
    res.json({
      tips: tips.map(t => ({ id: t._id.toString(), content: t.content, category: t.category })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/games/:gameParam/faqs', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const faqs = await FAQ.find({ gameId: game._id }).lean();
    res.json({
      faqs: faqs.map(f => ({
        id: f._id.toString(),
        question: f.question,
        answer: f.answer,
        views: f.views,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/games', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const { tips = [], faqs = [], ...gameInput } = payload;
    gameInput.theme = normalizeTheme(gameInput.theme);
    const game = await Game.create(gameInput);

    const tipDocs = tips.map(t =>
      typeof t === 'string'
        ? { gameId: game._id, content: t, category: 'gameplay' }
        : {
            gameId: game._id,
            content: t.content,
            category: t.category || 'gameplay',
          }
    );
    const faqDocs = faqs.map(item => ({
      gameId: game._id,
      question: item.question,
      answer: item.answer,
    }));
    if (tipDocs.length) await Tip.insertMany(tipDocs);
    if (faqDocs.length) await FAQ.insertMany(faqDocs);

    res.status(201).json({ game: sanitizeGame(game) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Game with that slug or title already exists' });
    }
    next(err);
  }
});

router.put('/games/:gameParam', verifyToken, async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const canEdit = req.user.role === 'admin' || (req.user.role === 'mod' && (await canModerateGame(req.user.sub, game._id)));
    if (!canEdit) return res.status(403).json({ error: 'Admin or assigned moderator required' });
    const updates = req.body || {};
    const allowed = [
      'title',
      'slug',
      'platform',
      'releaseYear',
      'versionLabel',
      'description',
      'coverImageUrl',
      'coverGifUrl',
      'heroImageUrl',
      'gameplayGifUrl',
      'hoverImageUrl',
      'hoverGifUrl',
      'screenshots',
      'theme',
    ];
    if (Object.prototype.hasOwnProperty.call(updates, 'theme')) {
      updates.theme = normalizeTheme(updates.theme, game.theme);
    }

    allowed.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        game[key] = key === 'theme' ? normalizeTheme(updates[key], game.theme) : updates[key];
      }
    });
    await game.save();
    res.json({ game: sanitizeGame(game) });
  } catch (err) {
    next(err);
  }
});

router.delete('/games/:gameParam', verifyToken, async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const canEdit = req.user.role === 'admin' || (req.user.role === 'mod' && (await canModerateGame(req.user.sub, game._id)));
    if (!canEdit) return res.status(403).json({ error: 'Admin or assigned moderator required' });
    await Promise.all([
      Game.deleteOne({ _id: game._id }),
      Tip.deleteMany({ gameId: game._id }),
      FAQ.deleteMany({ gameId: game._id }),
    ]);
    res.json({ message: 'Game deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
