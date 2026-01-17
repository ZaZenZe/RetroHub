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

console.log('[gateway] targets:', targets);

app.use(express.json());

app.use(
  '/api/auth',
  createProxyMiddleware({
    target: targets.auth,
    changeOrigin: true,
    pathRewrite: { '^': '/auth' },
    logLevel: 'warn',
  })
);

app.use(
  '/api/users',
  createProxyMiddleware({
    target: targets.user,
    changeOrigin: true,
    pathRewrite: { '^': '/users' },
    logLevel: 'warn',
  })
);

app.use(
  '/api/games',
  createProxyMiddleware({
    target: targets.game,
    changeOrigin: true,
    pathRewrite: { '^': '/games' },
    logLevel: 'warn',
  })
);

app.use(
  '/api/community',
  createProxyMiddleware({
    target: targets.community,
    changeOrigin: true,
    pathRewrite: { '^': '/community' },
    logLevel: 'warn',
  })
);

app.use(
  '/api/chat',
  createProxyMiddleware({
    target: targets.ai,
    changeOrigin: true,
    pathRewrite: { '^': '/chat' },
    logLevel: 'warn',
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', services: targets, timestamp: Date.now() });
});

// Static files and SPA shell AFTER API routes
app.use(express.static(FRONTEND_DIR));

// Serve SPA shell for any non-API route
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway running at http://0.0.0.0:${PORT}`);
});
