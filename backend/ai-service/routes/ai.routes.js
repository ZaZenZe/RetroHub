'use strict';

const express = require('express');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const {
  hasGeminiKey,
  fetchPopularCharacters,
  buildCharacterPersona,
  buildAssistantPersona,
  generateCharacterGreeting,
  generateAssistantGreeting,
  generateChatReply,
} = require('../utils/gemini');

const HISTORY_LIMIT = 12;
const sessions = new Map();
const FALLBACK_NOTICE = 'Using RetroHub assistant instead.';
const ASSISTANTS = [
  { name: 'Retro Rick', gender: 'male', isInGame: false },
  { name: 'Retro Rose', gender: 'female', isInGame: false },
];

function normalizeString(value) {
  return (value || '').toString().trim();
}

function normalizeGameInfo(raw = {}) {
  return {
    gameId: raw.gameId || null,
    gameName: normalizeString(raw.gameName),
    platform: normalizeString(raw.platform),
    releaseYear: normalizeString(raw.releaseYear),
  };
}

function normalizeCharacter(raw = {}) {
  const gender = normalizeString(raw.gender).toLowerCase();
  return {
    name: normalizeString(raw.name),
    gender: gender === 'female' ? 'female' : 'male',
    isInGame: Boolean(raw.isInGame),
  };
}

function gameKey(gameInfo) {
  return gameInfo?.gameId || gameInfo?.gameName || 'home';
}

function sessionKey(userId, gameInfo, characterName) {
  return `${userId || 'anon'}:${gameKey(gameInfo)}:${characterName || 'unknown'}`;
}

function trimHistory(history) {
  return (history || []).slice(-HISTORY_LIMIT);
}

function pickAssistantPersona(preferredName) {
  if (preferredName) {
    const found = ASSISTANTS.find(a => a.name.toLowerCase() === preferredName.toLowerCase());
    if (found) return { ...found };
  }
  return { ...ASSISTANTS[Math.floor(Math.random() * ASSISTANTS.length)] };
}

function clearSessionForGame(userId, gameInfo) {
  const prefix = `${userId || 'anon'}:${gameKey(gameInfo)}:`;
  for (const key of [...sessions.keys()]) {
    if (key.startsWith(prefix)) {
      sessions.delete(key);
    }
  }
}

function ensureGemini(res) {
  if (!hasGeminiKey()) {
    res.status(503).json({ error: 'Gemini is not configured. Set GEMINI_API_KEY.' });
    return false;
  }
  return true;
}

const router = express.Router();

router.post('/api/chat/init', verifyToken, async (req, res, next) => {
  try {
    if (!ensureGemini(res)) return;

    const gameInfo = normalizeGameInfo(req.body || {});
    clearSessionForGame(req.user?.sub, gameInfo);
    const isHome = !gameInfo.gameName;

    if (isHome) {
      const assistant = pickAssistantPersona();
      let greeting;
      try {
        greeting = await generateAssistantGreeting({
          assistantName: assistant.name,
          gender: assistant.gender,
          gameName: 'retro and classic games',
        });
      } catch (err) {
        console.warn('[ai-service] Gemini greeting failed on init, using static assistant greeting', err.message);
        greeting = `${FALLBACK_NOTICE} Ask me about any retro or classic game.`;
      }

      const key = sessionKey(req.user?.sub, gameInfo, assistant.name);
      sessions.set(key, {
        character: assistant,
        gameInfo,
        messages: [{ role: 'assistant', text: greeting }],
      });

      return res.json({
        success: true,
        needsCharacterSelection: false,
        character: { ...assistant, greeting },
        message: greeting,
      });
    }

    const genericMessage = `Welcome! 🌟 I'm initialized for ${gameInfo.gameName}. Shall we summon a guide from the game world, or would you prefer a chat with our resident experts?`;
    return res.json({
      success: true,
      needsCharacterSelection: true,
      gameName: gameInfo.gameName,
      message: genericMessage,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/api/chat/select-character', verifyToken, async (req, res, next) => {
  try {
    if (!ensureGemini(res)) return;

    const choice = normalizeString(req.body?.choice).toLowerCase();
    const gameInfo = normalizeGameInfo(req.body || {});

    if (choice !== 'in-game' && choice !== 'assistant') {
      return res.status(400).json({ error: 'choice must be "in-game" or "assistant"' });
    }
    if (choice === 'in-game' && !gameInfo.gameName) {
      return res.status(400).json({ error: 'gameName is required for in-game choice' });
    }

    clearSessionForGame(req.user?.sub, gameInfo);

    let character = null;
    let usedFallback = false;
    let inGameAvailable = true;
    const assistantName = normalizeString(req.body?.assistantName);

    if (choice === 'in-game') {
      try {
        const candidates = await fetchPopularCharacters(gameInfo);
        if (!candidates.length) {
          console.warn(`[ai-service] Game not recognized by AI: ${gameInfo.gameName}`);
          inGameAvailable = false;
          usedFallback = true;
        } else {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          character = {
            name: pick.name,
            gender: pick.gender,
            isInGame: true,
            gameName: gameInfo.gameName,
          };
        }
      } catch (err) {
        console.warn('[ai-service] Gemini character lookup failed, using RetroHub assistant', err.message);
        inGameAvailable = false;
        usedFallback = true;
      }
    }

    if (!character) {
      character = pickAssistantPersona(assistantName || undefined);
    }

    let greeting;
    try {
      greeting = character.isInGame
        ? await generateCharacterGreeting({
            characterName: character.name,
            gender: character.gender,
            gameName: gameInfo.gameName,
            platform: gameInfo.platform,
            releaseYear: gameInfo.releaseYear,
          })
        : await generateAssistantGreeting({
            assistantName: character.name,
            gender: character.gender,
            gameName: gameInfo.gameName || 'retro games',
          });
    } catch (err) {
      console.warn('[ai-service] Gemini greeting failed, falling back to RetroHub assistant', err.message);
      const assistant = pickAssistantPersona();
      character = assistant;
      usedFallback = true;
      try {
        greeting = await generateAssistantGreeting({
          assistantName: assistant.name,
          gender: assistant.gender,
          gameName: gameInfo.gameName || 'retro games',
        });
      } catch (fallbackErr) {
        greeting = `${FALLBACK_NOTICE} What can I help you with for ${gameInfo.gameName || 'retro games'}?`;
      }
    }

    const key = sessionKey(req.user?.sub, gameInfo, character.name);
    sessions.set(key, {
      character,
      gameInfo,
      messages: greeting ? [{ role: 'assistant', text: greeting }] : [],
    });

    return res.json({
      success: true,
      character: { ...character, greeting },
      fallbackToAssistant: usedFallback,
      inGameAvailable,
      notice: usedFallback ? FALLBACK_NOTICE : undefined,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/api/chat/message', verifyToken, async (req, res, next) => {
  try {
    if (!ensureGemini(res)) return;

    const message = normalizeString(req.body?.message);
    const gameInfo = normalizeGameInfo(req.body?.gameInfo || req.body || {});
    const incomingCharacter = normalizeCharacter(req.body?.character || {});

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!incomingCharacter.name) {
      return res.status(400).json({ error: 'character.name is required' });
    }

    const key = sessionKey(req.user?.sub, gameInfo, incomingCharacter.name);
    const session = sessions.get(key) || { character: incomingCharacter, gameInfo, messages: [] };
    const history = trimHistory(session.messages);
    const personaPrompt = incomingCharacter.isInGame
      ? buildCharacterPersona({
          characterName: incomingCharacter.name,
          gender: incomingCharacter.gender,
          gameName: gameInfo.gameName,
          platform: gameInfo.platform,
          releaseYear: gameInfo.releaseYear,
        })
      : buildAssistantPersona({
          assistantName: incomingCharacter.name,
          gender: incomingCharacter.gender,
          gameName: gameInfo.gameName,
        });

    let responseText;
    try {
      responseText = await generateChatReply({
        personaPrompt,
        history,
        userMessage: message,
      });
    } catch (err) {
      console.warn('[ai-service] Gemini chat failed, switching to RetroHub assistant', err.message);
      const assistant = pickAssistantPersona();
      const fallbackPrompt = buildAssistantPersona({
        assistantName: assistant.name,
        gender: assistant.gender,
        gameName: gameInfo.gameName || 'retro games',
      });
      let fallbackResponse;
      try {
        fallbackResponse = await generateChatReply({
          personaPrompt: fallbackPrompt,
          history: [],
          userMessage: message,
        });
      } catch (fallbackErr) {
        fallbackResponse = `${FALLBACK_NOTICE} Ask me about ${gameInfo.gameName || 'retro games'}.`;
      }

      const fallbackKey = sessionKey(req.user?.sub, gameInfo, assistant.name);
      sessions.set(fallbackKey, {
        character: assistant,
        gameInfo,
        messages: [{ role: 'assistant', text: fallbackResponse }],
      });
      return res.json({
        success: true,
        response: fallbackResponse,
        fallbackToAssistant: true,
        character: assistant,
        notice: FALLBACK_NOTICE,
      });
    }

    const nextHistory = trimHistory([
      ...history,
      { role: 'user', text: message },
      { role: 'assistant', text: responseText },
    ]);

    sessions.set(key, {
      character: incomingCharacter,
      gameInfo,
      messages: nextHistory,
    });

    return res.json({
      success: true,
      response: responseText,
      historyLength: nextHistory.length,
      character: incomingCharacter,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
