'use strict';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function hasGeminiKey() {
  return Boolean(GEMINI_API_KEY);
}

/**
 * Call Gemini API with the provided prompt.
 * @param {string} prompt user prompt text
 * @returns {Promise<string>} model response text
 */
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.status = 500;
    throw err;
  }

  const upstream = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    const message = data?.error?.message || upstream.statusText || 'Gemini request failed';
    const err = new Error(message);
    err.status = upstream.status || 502;
    throw err;
  }

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map(part => part.text)
    .filter(Boolean)
    .join('')
    .trim();

  return text || 'No response returned from Gemini.';
}

module.exports = { callGemini, hasGeminiKey };
