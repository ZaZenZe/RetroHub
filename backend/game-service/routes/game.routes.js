'use strict';

const express = require('express');
const { Types } = require('mongoose');
const Game = require('../../shared/models/Game');
const Tip = require('../../shared/models/Tip');
const FAQ = require('../../shared/models/FAQ');

const router = express.Router();

router.get('/games', async (req, res, next) => {
  try {
    const { q, platform } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const minYear = parseInt(req.query.minYear, 10);
    const maxYear = parseInt(req.query.maxYear, 10);

    const filter = {};
    if (q) {
      filter.title = new RegExp(q, 'i');
    }
    if (platform) {
      filter.platform = platform;
    }
    if (!Number.isNaN(minYear) || !Number.isNaN(maxYear)) {
      filter.releaseYear = {};
      if (!Number.isNaN(minYear)) filter.releaseYear.$gte = minYear;
      if (!Number.isNaN(maxYear)) filter.releaseYear.$lte = maxYear;
    }
    const [games, total] = await Promise.all([
      Game.find(filter)
        .sort({ releaseYear: -1, title: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Game.countDocuments(filter),
    ]);
    res.json({ games, page, total });
  } catch (err) {
    next(err);
  }
});

router.get('/games/:id', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ game });
  } catch (err) {
    next(err);
  }
});

router.get('/games/:id/tips', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }
    const tips = await Tip.findByGame(req.params.id);
    res.json({ tips });
  } catch (err) {
    next(err);
  }
});

router.get('/games/:id/faqs', async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }
    const faqs = await FAQ.findByGame(req.params.id);
    res.json({ faqs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
