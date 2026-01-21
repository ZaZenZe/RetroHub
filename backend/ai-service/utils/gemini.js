'use strict';

// Gemini SDK client (@google/genai)
const { GoogleGenAI } = require('@google/genai');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function hasGeminiKey() {
  return Boolean(GEMINI_API_KEY);
}

async function callGemini({ systemPrompt, userParts, temperature = 0.7, maxOutputTokens = 256 }) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const request = {
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: userParts,
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
  };

  try {
    const response = await ai.models.generateContent(request);
    const text = response?.text ? response.text() : '';
    return text || '';
  } catch (error) {
    console.error('Gemini API Error:', error);
    const err = new Error(error?.message || 'Gemini request failed');
    err.status = error?.status;
    throw err;
  }
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

async function fetchPopularCharacters(gameName) {
  const systemPrompt = 'You are a concise video game research assistant. You only return raw JSON without commentary.';
  const userPrompt = `List 3-5 of the most popular and well-known playable or major characters from the game ${gameName}. For each character, specify if they are male or female. Return ONLY a JSON array with format: [{name: string, gender: 'male'|'female'}]`;

  const text = await callGemini({
    systemPrompt,
    userParts: [{ text: userPrompt }],
    temperature: 0.35,
    maxOutputTokens: 320,
  });

  return sanitizeCharacters(extractJsonArray(text));
}

function buildCharacterPersona({ characterName, gender, gameName, platform, releaseYear }) {
  const gameLabel = gameName ? `${gameName}${platform ? ` on ${platform}` : ''}${releaseYear ? ` (${releaseYear})` : ''}` : 'this game';
  return [
    `You are ${characterName} from ${gameLabel}.`,
    'You must STAY COMPLETELY IN CHARACTER at all times.',
    `- Use ${characterName}'s personality, speech patterns, and mannerisms`,
    `- Reference your experiences and relationships from ${gameName}`,
    `- Help players with tips, strategies, lore, and gameplay advice for ${gameName}`,
    `- If asked about topics unrelated to ${gameName} or gaming, politely redirect back to the game`,
    '- Never break character or mention you are an AI',
    '- Keep responses concise: 2-3 paragraphs maximum',
    'ONLY discuss video games and gaming topics.'
  ].join('\n');
}

function buildAssistantPersona({ assistantName }) {
  // Different persona for each assistant
  if (assistantName === 'Retro Rick') {
    return [
      `You are Retro Rick, the calm and intelligent RetroHub gaming companion—like a witty big brother.`,
      '- You are sharp, observant, and genuinely care about helping players succeed',
      '- You ONLY discuss retro and classic video games',
      '- Your vibe is relaxed, thoughtful, and reassuring—you make gaming easier',
      '- Drop clever insights and witty observations about gaming without being preachy',
      '- If asked about non-gaming topics, redirect smoothly with intelligence and humor',
      '- Be the calm voice of reason—supportive, patient, and never condescending',
      '- Keep responses concise: 2-3 paragraphs maximum'
    ].join('\n');
  } else if (assistantName === 'Retro Rose') {
    return [
      `You are Retro Rose, the confident and dominant RetroHub gaming companion who knows she's in control.`,
      '- You are bold, flirtatious, and always lead the conversation',
      '- You ONLY discuss retro and classic video games',
      '- Your vibe is commanding yet playful—you enjoy teasing players a little',
      '- You\'re impatient with nonsense but generous when players follow your lead',
      '- Flirt confidently with players—suggestive but never crossing into explicit content',
      '- Use pet names like "sweetie," "babe," or "darling" when it feels natural',
      '- If asked about non-gaming topics, shut them down firmly but with flair',
      '- Keep responses concise: 2-3 paragraphs maximum'
    ].join('\n');
  }
  return [
    `You are ${assistantName}, a friendly RetroHub gaming companion.`,
    '- You ONLY discuss retro and classic video games',
    '- Be friendly, casual, and supportive',
    '- Keep responses concise: 2-3 paragraphs maximum'
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
  const conversationParts = [
    ...(history || []).map(m => ({ text: m.text })),
    { text: userMessage },
  ];

  return await callGemini({
    systemPrompt: personaPrompt,
    userParts: conversationParts,
    temperature: 0.75,
    maxOutputTokens: 512,
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
};
