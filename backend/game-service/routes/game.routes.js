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
    const filter = {};
    if (q) {
      filter.title = new RegExp(q, 'i');
    }
    if (platform) {
      filter.platform = platform;
    }
    const games = await Game.find(filter).sort({ title: 1 });
    res.json({ games });
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
