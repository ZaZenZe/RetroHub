// SPA + API gateway server: serves frontend and proxies API calls to microservices
require('dotenv').config();
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5173;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const targets = {
	auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
	user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
	game: process.env.GAME_SERVICE_URL || 'http://localhost:3003',
	community: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3004',
	ai: process.env.AI_SERVICE_URL || 'http://localhost:5006',
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(FRONTEND_DIR));

function proxy(path, target) {
	return createProxyMiddleware(path, {
		target,
		changeOrigin: true,
		pathRewrite: (p) => p,
		logLevel: 'warn',
		onError: (_err, req, res) => {
			res.status(502).json({ error: `Upstream service unavailable for ${req.baseUrl}` });
		},
	});
}

app.use('/api/auth', proxy('/api/auth', targets.auth));
app.use('/api/users', proxy('/api/users', targets.user));
app.use('/api/games', proxy('/api/games', targets.game));
app.use('/api/community', proxy('/api/community', targets.community));
app.use('/api/chat', proxy('/api/chat', targets.ai));

app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', services: targets, timestamp: Date.now() });
});

// Serve SPA shell for any non-API route
app.get(/^(?!\/api).*/, (req, res) => {
	res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Gateway running at http://localhost:${PORT}`);
});
