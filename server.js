// SPA + API gateway server: serves frontend and proxies API calls to microservices
require('dotenv').config();
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5173;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

function resolveTarget(envKey, fallback) {
  const value = process.env[envKey];
  if (value && value.trim()) return value.trim();
  return fallback;
}

const targets = {
  auth: resolveTarget('AUTH_SERVICE_URL', 'http://localhost:3001'),
  user: resolveTarget('USER_SERVICE_URL', 'http://localhost:3002'),
  game: resolveTarget('GAME_SERVICE_URL', 'http://localhost:3003'),
  community: resolveTarget('COMMUNITY_SERVICE_URL', 'http://localhost:3004'),
  ai: resolveTarget('AI_SERVICE_URL', 'http://localhost:3005'),
};

if (process.env.NODE_ENV !== 'production') {
  console.log('[gateway] proxy targets', targets);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(FRONTEND_DIR));

function proxy(envKey, target) {
  const targetUrl = (target || '').toString().trim();

  if (!targetUrl) {
    throw new Error(`Proxy target missing. Set ${envKey} in your environment.`);
  }

  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    logLevel: 'warn',
    onError: (_err, req, res) => {
      res.status(502).json({ error: `Upstream service unavailable for ${req.baseUrl}` });
    },
  });
}

app.use('/api/auth', proxy('AUTH_SERVICE_URL', targets.auth));
app.use('/api/users', proxy('USER_SERVICE_URL', targets.user));
app.use('/api/games', proxy('GAME_SERVICE_URL', targets.game));
app.use('/api/community', proxy('COMMUNITY_SERVICE_URL', targets.community));
app.use('/api/chat', proxy('AI_SERVICE_URL', targets.ai));

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
