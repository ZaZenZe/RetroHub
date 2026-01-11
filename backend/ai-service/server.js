'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectWithRetry } = require('../shared/db');
const { corsOptions } = require('../shared/config/cors.config');
const { verifyToken } = require('../shared/middleware/auth.middleware');
const { errorHandler } = require('../shared/middleware/error.middleware');
const UserStats = require('../shared/models/UserStats');

const PORT = process.env.PORT || 5006;
const MAX_JSON = process.env.MAX_JSON || '1mb';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: MAX_JSON }));

app.get('/health', (req, res) => {
	res.json({ status: 'ok', service: 'ai-service', model: GEMINI_MODEL });
});

app.post('/chat', verifyToken, async (req, res, next) => {
	try {
		if (!GEMINI_API_KEY) {
			return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
		}
		const promptText = ((req.body && (req.body.prompt || req.body.message)) || '').toString().trim();
		if (!promptText) {
			return res.status(400).json({ error: 'prompt is required' });
		}
		const upstream = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [ { role: 'user', parts: [ { text: promptText } ] } ],
			})
		});
		const data = await upstream.json();
		if (!upstream.ok) {
			const message = data?.error?.message || upstream.statusText || 'Gemini request failed';
			return res.status(upstream.status).json({ error: message });
		}
		const text = (data?.candidates?.[0]?.content?.parts || [])
			.map(part => part.text)
			.filter(Boolean)
			.join('')
			.trim();
		if (req.user?.sub) {
			await UserStats.findOneAndUpdate(
				{ userId: req.user.sub },
				{ $inc: { aiChatsCount: 1 }, $setOnInsert: { userId: req.user.sub } },
				{ upsert: true, setDefaultsOnInsert: true }
			);
		}
		return res.json({ text: text || 'No response returned from Gemini.' });
	} catch (err) {
		return next(err);
	}
});

app.use(errorHandler);

let server;

async function start() {
	await connectWithRetry();
	server = app.listen(PORT, () => {
		console.log(`AI service running on port ${PORT}`);
	});
}

function gracefulShutdown(signal) {
	console.log(`[ai-service] received ${signal}, shutting down...`);
	if (server) {
		server.close(() => process.exit(0));
	} else {
		process.exit(0);
	}
}

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => gracefulShutdown(sig)));

start().catch(err => {
	console.error('[ai-service] failed to start', err);
	process.exit(1);
});
