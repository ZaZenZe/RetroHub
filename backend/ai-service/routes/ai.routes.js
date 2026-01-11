'use strict';

const express = require('express');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const { callGemini } = require('../utils/gemini');

const router = express.Router();

router.post('/chat', verifyToken, async (req, res, next) => {
  try {
    const prompt = ((req.body && (req.body.prompt || req.body.message)) || '').toString().trim();
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const text = await callGemini(prompt);
    return res.json({ text });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
