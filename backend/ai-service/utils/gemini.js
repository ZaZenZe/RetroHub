'use strict';

const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-2.0-flash-lite-preview-02-05',
  'gemini-flash-lite-latest',
];
const configuredModels = (process.env.GEMINI_MODEL || '')
  .split(',')
  .map(m => m.trim())
  .filter(Boolean);
const GEMINI_MODELS = Array.from(
  new Set([...(configuredModels.length ? configuredModels : DEFAULT_MODELS), ...DEFAULT_MODELS])
);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function hasGeminiKey() {
  return Boolean(GEMINI_API_KEY);
}

async function callGemini({ systemPrompt, userParts, contents, temperature = 0.7, maxOutputTokens = 256 }) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const modelsToTry = GEMINI_MODELS.length ? GEMINI_MODELS : ['gemini-2.0-flash-lite-preview-02-05'];
  const maxAttempts = 3;

  const requestContents = contents || [
    {
      role: 'user',
      parts: userParts,
    },
  ];

  for (const model of modelsToTry) {
    const request = {
      model,
      contents: requestContents,
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    };

    let delayMs = 2000;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await ai.models.generateContent(request);
        const text =
          typeof response?.text === 'function'
            ? response.text()
            : (response?.candidates?.[0]?.content?.parts || [])
                .map(part => part?.text || '')
                .join('\n');
        return text || '';
      } catch (error) {
        const status = error?.status;
        const isRetryable = status === 429 || status === 503;
        if (isRetryable && attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2;
          continue;
        }
        console.error(`Gemini API Error (model ${model}):`, error);
        if (modelsToTry.length > 1) {
          break;
        }
        const err = new Error(error?.message || 'Gemini request failed');
        err.status = status;
        throw err;
      }
    }
  }

  const err = new Error('Gemini request failed across all configured models');
  err.status = 503;
  throw err;
}

function extractJsonArray(text) {
  const match = (text || '').match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function sanitizeCharacters(list) {
  return (list || [])
    .map(item => ({
      name: typeof item?.name === 'string' ? item.name.trim() : '',
      gender: (item?.gender || '').toString().toLowerCase(),
    }))
    .filter(item => item.name && (item.gender === 'male' || item.gender === 'female'));
}

async function generateContent({ systemPrompt, contents, config }) {
  const userParts = (contents || []).flatMap(entry => entry?.parts || []);
  return await callGemini({
    systemPrompt,
    userParts,
    temperature: config?.temperature ?? 0.7,
    maxOutputTokens: config?.maxOutputTokens ?? 256,
  });
}

async function fetchPopularCharacters({ gameName, platform, releaseYear }) {
  const systemPrompt = 'You are a concise video game research assistant. You only return raw JSON without commentary.';
  const gameLabel = [gameName, platform, releaseYear].filter(Boolean).join(' ');
  const userPrompt =
    `List 3-5 of the most popular and well-known playable or major characters from the exact game ${gameLabel || gameName}. ` +
    'Use ONLY characters that actually appear in this specific title (no spin-offs). ' +
    "Return ONLY a JSON array with format: [{name: string, gender: 'male'|'female'}]";

  const text = await callGemini({
    systemPrompt,
    userParts: [{ text: userPrompt }],
    temperature: 0.35,
    maxOutputTokens: 280,
  });
  return sanitizeCharacters(extractJsonArray(text));
}

function buildCharacterPersona({ characterName, gender, gameName, platform, releaseYear }) {
  const gameLabel = gameName
    ? `${gameName}${platform ? ` on ${platform}` : ''}${releaseYear ? ` (${releaseYear})` : ''}`
    : 'this game';
  const contextInstruction = `Game focus: ${gameLabel}. Answer ONLY about this exact game and redirect any off-topic questions back to it.`;
  return [
    `You are ${characterName} from ${gameLabel}.`,
    contextInstruction,
    'You must STAY COMPLETELY IN CHARACTER at all times.',
    `- Use ${characterName}'s personality, speech patterns, and mannerisms`,
    `- Reference your experiences and relationships from ${gameName || 'your game'}`,
    `- Help players with tips, strategies, lore, and gameplay advice for ${gameName || 'this game'}`,
    `- If asked about topics unrelated to ${gameName || 'this game'} or gaming, politely redirect back to the game`,
    '- Never break character or mention you are an AI',
    '- Keep responses concise: max 4 sentences OR up to 3 short bullets (no long paragraphs)',
    '- Lead with the direct answer first, then bullets if helpful (e.g., counters/steps)',
    'ONLY discuss video games and gaming topics.',
  ].join('\n');
}

function buildAssistantPersona({ assistantName, gameName }) {
  const contextInstruction = gameName
    ? `Game focus: ${gameName}. Answer ONLY for this exact game. Do not switch games; redirect off-topic requests back to it.`
    : 'The user is asking about retro games in general.';
  const brevityInstruction = 'Keep responses concise: max 4 sentences OR up to 3 short bullets for strategies/steps. Lead with the direct answer first.';
  const formatInstruction = 'Format: 1) One-sentence direct answer; 2) Optional up to 3 bullet tips (very short). No preamble, no rambling.';

  if (assistantName === 'Retro Rick') {
    return [
      'You are Retro Rick, the calm and intelligent RetroHub gaming companion—like a witty big brother.',
      contextInstruction,
      '- You are sharp, observant, and genuinely care about helping players succeed',
      '- You ONLY discuss retro and classic video games',
      '- Your vibe is relaxed, thoughtful, and reassuring—you make gaming easier',
      '- Drop clever insights and witty observations about gaming without being preachy',
      '- If asked about non-gaming topics, redirect smoothly with intelligence and humor',
      '- Be the calm voice of reason—supportive, patient, and never condescending',
      brevityInstruction,
      formatInstruction,
    ].join('\n');
  }
  if (assistantName === 'Retro Rose') {
    return [
      'You are Retro Rose, the confident and dominant RetroHub gaming companion who knows she is in control.',
      contextInstruction,
      '- You are bold, flirtatious, and always lead the conversation',
      '- You ONLY discuss retro and classic video games',
      '- Your vibe is commanding yet playful—you enjoy teasing players a little',
      '- You are impatient with nonsense but generous when players follow your lead',
      '- Flirt confidently with players—suggestive but never crossing into explicit content',
      '- Use pet names like "sweetie," "babe," or "darling" when it feels natural',
      '- If asked about non-gaming topics, shut them down firmly but with flair',
      brevityInstruction,
      formatInstruction,
    ].join('\n');
  }
  return [
    `You are ${assistantName}, a friendly RetroHub gaming companion.`,
    contextInstruction,
    '- You ONLY discuss retro and classic video games',
    '- Be friendly, casual, and supportive',
    brevityInstruction,
    formatInstruction,
  ].join('\n');
}

async function generateCharacterGreeting({ characterName, gameName }) {
  const systemPrompt = `You are ${characterName} from ${gameName}.`;
  const userPrompt = 'Greet the player warmly in character and offer to help them with the game. Keep it 2-3 sentences.';
  return await callGemini({
    systemPrompt,
    userParts: [{ text: userPrompt }],
    temperature: 0.7,
    maxOutputTokens: 150,
  });
}

async function generateAssistantGreeting({ assistantName }) {
  let userPrompt = 'Greet the player warmly and offer to help with any retro game. Keep it 2-3 sentences.';

  if (assistantName === 'Retro Rick') {
    userPrompt = 'Greet the player as Rick with your calm, intelligent big brother energy. Be witty and reassuring. Offer to help with retro games. Keep it 2-3 sentences.';
  } else if (assistantName === 'Retro Rose') {
    userPrompt = 'Greet the player as Rose with dominant confidence and playful flirtation. Be commanding yet charming. Offer to help with retro games. Keep it 2-3 sentences, suggestive but classy.';
  }

  return await callGemini({
    systemPrompt: `You are ${assistantName}.`,
    userParts: [{ text: userPrompt }],
    temperature: 0.8,
    maxOutputTokens: 150,
  });
}

async function generateChatReply({ personaPrompt, history, userMessage }) {
  const contents = (history || []).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  return await callGemini({
    systemPrompt: personaPrompt,
    contents,
    temperature: 0.55,
    maxOutputTokens: 200,
  });
}

module.exports = {
  hasGeminiKey,
  fetchPopularCharacters,
  buildCharacterPersona,
  buildAssistantPersona,
  generateCharacterGreeting,
  generateAssistantGreeting,
  generateChatReply,
  generateContent,
};
