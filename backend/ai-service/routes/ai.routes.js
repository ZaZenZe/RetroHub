'use strict';

const express = require('express');
const { verifyToken } = require('../shared/middleware/auth.middleware');
const { callGemini, hasGeminiKey } = require('../utils/gemini');

const HISTORY_LIMIT = 6;
const sessionHistory = new Map();

function sessionKey(userId, gameId) {
  return `${userId || 'anon'}:${gameId || 'global'}`;
}

function trimHistory(hist) {
  return hist.slice(-HISTORY_LIMIT * 2);
}

const router = express.Router();

router.post('/chat', verifyToken, async (req, res, next) => {
  try {
    if (!hasGeminiKey()) {
      return res.status(503).json({ error: 'Gemini is not configured. Set GEMINI_API_KEY.' });
    }

    const prompt = ((req.body && (req.body.prompt || req.body.message)) || '').toString().trim();
    const message = ((req.body && req.body.message) || '').toString().trim();
    const gameId = req.body?.gameId || null;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const key = sessionKey(req.user?.sub, gameId);
    const history = sessionHistory.get(key) || [];
    const historyText = history
      .map(h => `${h.role}: ${h.text}`)
      .join('\n')
      .slice(-2000);

    const composedPrompt = [
      prompt,
      historyText
        ? `Recent chat history for continuity (keep replies concise):\n${historyText}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const text = await callGemini(composedPrompt);

    const nextHistory = trimHistory([
      ...history,
      { role: 'user', text: message || prompt },
      { role: 'assistant', text },
    ]);
    sessionHistory.set(key, nextHistory);

    return res.json({ text, historyLength: nextHistory.length });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
