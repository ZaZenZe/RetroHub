'use strict';

const express = require('express');
const { Types } = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Game = require('../../shared/models/Game');
const Tip = require('../../shared/models/Tip');
const FAQ = require('../../shared/models/FAQ');
const User = require('../../shared/models/User');
const { verifyToken } = require('../../shared/middleware/auth.middleware');

const router = express.Router();

async function loadCurrentUser(req, res, next) {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.currentUser = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

function isAdmin(user) {
  return user?.role === 'admin';
}

function isMod(user) {
  return user?.role === 'mod';
}

function hasGamePermission(user, gameId) {
  if (isAdmin(user)) return true;
  if (!user || !isMod(user) || !gameId) return false;
  return (user.moderatedGames || []).some(gid => gid.toString() === gameId.toString());
}

// Apply auth to all admin routes
router.use(verifyToken, loadCurrentUser);

// Theme defaults reused for create/update responses
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
    return {
      ...DEFAULT_THEME,
      colors: { ...DEFAULT_THEME.colors },
      name: input.trim() || DEFAULT_THEME.name,
    };
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

function isObjectId(value) {
  return Types.ObjectId.isValid(value);
}

async function findGameByParam(param) {
  const query = isObjectId(param) ? { _id: param } : { slug: param };
  return Game.findOne(query);
}

function sanitizeGame(doc) {
  if (!doc) return null;
  const g = doc.toObject({ versionKey: false });
  g.id = g._id.toString();
  g.theme = normalizeTheme(g.theme);
  return g;
}

function ensureGameAccess(req, game) {
  if (!game) return false;
  if (hasGamePermission(req.currentUser, game._id)) return true;
  return false;
}

// Get all games with full details (admin view)
router.get('/games', async (req, res, next) => {
  try {
    const { q, platform, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (q) filter.title = new RegExp(q, 'i');
    if (platform) filter.platform = platform;

    // Mods only see games they moderate
    if (!isAdmin(req.currentUser)) {
      filter._id = { $in: req.currentUser.moderatedGames || [] };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [games, total] = await Promise.all([
      Game.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Game.countDocuments(filter),
    ]);

    res.json({
      games: games.map(g => ({
        ...g,
        id: g._id?.toString(),
        theme: normalizeTheme(g.theme),
      })),
      page: parseInt(page, 10),
      total,
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
});

// Get single game with all associated data
router.get('/games/:gameParam', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const [tips, faqs] = await Promise.all([
      Tip.find({ gameId: game._id }).lean(),
      FAQ.find({ gameId: game._id }).lean(),
    ]);

    res.json({
      game: sanitizeGame(game),
      tips: tips.map(t => ({ ...t, id: t._id.toString() })),
      faqs: faqs.map(f => ({ ...f, id: f._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

// Create new game
router.post('/games', async (req, res, next) => {
  try {
    if (!isAdmin(req.currentUser)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { tips = [], faqs = [], ...gameData } = req.body;

    // Ensure theme has proper structure
    gameData.theme = normalizeTheme(gameData.theme);

    const game = await Game.create(gameData);

    // Create associated tips
    if (tips.length > 0) {
      const tipDocs = tips.map(t => ({
        gameId: game._id,
        content: typeof t === 'string' ? t : t.content,
        category: typeof t === 'object' ? t.category || 'gameplay' : 'gameplay',
      }));
      await Tip.insertMany(tipDocs);
    }

    // Create associated FAQs
    if (faqs.length > 0) {
      const faqDocs = faqs.map(f => ({
        gameId: game._id,
        question: f.question,
        answer: f.answer,
      }));
      await FAQ.insertMany(faqDocs);
    }

    res.status(201).json({ game: sanitizeGame(game) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Game with that slug or title already exists' });
    }
    next(err);
  }
});

// Update game
router.put('/games/:gameParam', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

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
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate slug or title' });
    }
    next(err);
  }
});

// Delete game
router.delete('/games/:gameParam', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    await Promise.all([
      Game.deleteOne({ _id: game._id }),
      Tip.deleteMany({ gameId: game._id }),
      FAQ.deleteMany({ gameId: game._id }),
    ]);

    res.json({ message: 'Game and associated data deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Upload image
router.post('/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

// Bulk upload images
router.post('/upload/bulk', upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const urls = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    }));

    res.json({ images: urls });
  } catch (err) {
    next(err);
  }
});

// Manage tips for a game
router.post('/games/:gameParam/tips', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const { content, category = 'gameplay' } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Tip content is required' });
    }

    const tip = await Tip.create({
      gameId: game._id,
      content,
      category,
    });

    res.status(201).json({ tip: { ...tip.toObject(), id: tip._id.toString() } });
  } catch (err) {
    next(err);
  }
});

router.put('/games/:gameParam/tips/:tipId', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const tip = await Tip.findOne({ _id: req.params.tipId, gameId: game._id });
    if (!tip) return res.status(404).json({ error: 'Tip not found' });

    const { content, category } = req.body;
    if (content) tip.content = content;
    if (category) tip.category = category;

    await tip.save();
    res.json({ tip: { ...tip.toObject(), id: tip._id.toString() } });
  } catch (err) {
    next(err);
  }
});

router.delete('/games/:gameParam/tips/:tipId', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const result = await Tip.deleteOne({ _id: req.params.tipId, gameId: game._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    res.json({ message: 'Tip deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Manage FAQs for a game
router.post('/games/:gameParam/faqs', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const faq = await FAQ.create({
      gameId: game._id,
      question,
      answer,
    });

    res.status(201).json({ faq: { ...faq.toObject(), id: faq._id.toString() } });
  } catch (err) {
    next(err);
  }
});

router.put('/games/:gameParam/faqs/:faqId', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const faq = await FAQ.findOne({ _id: req.params.faqId, gameId: game._id });
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    const { question, answer } = req.body;
    if (question) faq.question = question;
    if (answer) faq.answer = answer;

    await faq.save();
    res.json({ faq: { ...faq.toObject(), id: faq._id.toString() } });
  } catch (err) {
    next(err);
  }
});

router.delete('/games/:gameParam/faqs/:faqId', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const result = await FAQ.deleteOne({ _id: req.params.faqId, gameId: game._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// List users (for assigning mods). Admins see all; mods can search to invite for their games.
router.get('/users', async (req, res, next) => {
  try {
    if (!isAdmin(req.currentUser) && !isMod(req.currentUser)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { q = '', limit = 30 } = req.query;
    const filter = q
      ? {
          $or: [
            { email: new RegExp(q, 'i') },
            { username: new RegExp(q, 'i') },
          ],
        }
      : {};
    const users = await User.find(filter)
      .limit(Math.min(parseInt(limit, 10) || 30, 100))
      .select('username email role moderatedGames')
      .lean();
    res.json({ users: users.map(u => ({ ...u, id: u._id?.toString() })) });
  } catch (err) {
    next(err);
  }
});

// List moderators for a game
router.get('/games/:gameParam/mods', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const mods = await User.find({ moderatedGames: game._id })
      .select('username email role moderatedGames')
      .lean();
    res.json({ mods: mods.map(u => ({ ...u, id: u._id?.toString() })) });
  } catch (err) {
    next(err);
  }
});

async function resolveUser(identifier) {
  if (!identifier) return null;
  if (Types.ObjectId.isValid(identifier)) return User.findById(identifier);
  return User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
}

// Add or update a moderator assignment for a game
router.post('/games/:gameParam/mods', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const { userId, email, username } = req.body || {};
    const candidate = await resolveUser(userId || email || username);
    if (!candidate) return res.status(404).json({ error: 'User not found' });

    if (!candidate.moderatedGames) candidate.moderatedGames = [];
    const already = candidate.moderatedGames.some(gid => gid.toString() === game._id.toString());
    if (!already) {
      candidate.moderatedGames.push(game._id);
    }
    if (candidate.role === 'user') {
      candidate.role = 'mod';
    }
    await candidate.save();

    res.status(201).json({
      mod: {
        id: candidate._id.toString(),
        username: candidate.username,
        email: candidate.email,
        role: candidate.role,
        moderatedGames: candidate.moderatedGames.map(gid => gid.toString()),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Remove moderator from a game
router.delete('/games/:gameParam/mods/:userId', async (req, res, next) => {
  try {
    const game = await findGameByParam(req.params.gameParam);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!ensureGameAccess(req, game)) return res.status(403).json({ error: 'Forbidden' });

    const candidate = await User.findById(req.params.userId);
    if (!candidate) return res.status(404).json({ error: 'User not found' });

    candidate.moderatedGames = (candidate.moderatedGames || []).filter(
      gid => gid.toString() !== game._id.toString()
    );

    // If no moderated games left and user is mod, optionally downgrade to user
    if (candidate.role === 'mod' && candidate.moderatedGames.length === 0) {
      candidate.role = 'user';
    }

    await candidate.save();
    res.json({
      mod: {
        id: candidate._id.toString(),
        username: candidate.username,
        email: candidate.email,
        role: candidate.role,
        moderatedGames: candidate.moderatedGames.map(gid => gid.toString()),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get theme presets
router.get('/themes', async (req, res, next) => {
  try {
    const presets = [
      {
        name: 'retro',
        label: 'Retro Classic',
        colors: {
          primary: '#ff7b00',
          primaryAlt: '#ff9f1a',
          accent: '#4fc3f7',
          background: '#0d0e12',
          card: '#1b1f29',
          text: '#e6e6e9',
          border: '#232734',
        },
      },
      {
        name: 'fire-red',
        label: 'Fire Red',
        colors: {
          primary: '#ff5e3a',
          primaryAlt: '#ff7452',
          accent: '#ffd700',
          background: '#1a0a0a',
          card: '#2a1515',
          text: '#ffe6e6',
          border: '#3d1f1f',
        },
      },
      {
        name: 'emerald',
        label: 'Emerald Green',
        colors: {
          primary: '#2ecc71',
          primaryAlt: '#27ae60',
          accent: '#a8e6cf',
          background: '#0a1a0a',
          card: '#152a15',
          text: '#e6ffe6',
          border: '#1f3d1f',
        },
      },
      {
        name: 'platinum',
        label: 'Platinum Silver',
        colors: {
          primary: '#95a5a6',
          primaryAlt: '#bdc3c7',
          accent: '#3498db',
          background: '#0f0f14',
          card: '#1a1a24',
          text: '#e8e8f0',
          border: '#2a2a38',
        },
      },
      {
        name: 'heart-gold',
        label: 'Heart Gold',
        colors: {
          primary: '#f39c12',
          primaryAlt: '#f1c40f',
          accent: '#e74c3c',
          background: '#1a1410',
          card: '#2a2218',
          text: '#fff5e6',
          border: '#3d3425',
        },
      },
    ];

    res.json({ themes: presets });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
