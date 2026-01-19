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

// NOTE: Do not register body parsers (express.json/urlencoded) before proxy routes.
// Doing so drains the request stream and can cause proxied POST/PUT requests to hang.
// If you need body parsing for non-proxy routes, apply it on those routes only.

// Common proxy configuration
const commonProxyOptions = {
  changeOrigin: true,
  proxyTimeout: 10000,
  timeout: 10000,
  onError: (err, req, res) => {
    console.error('[gateway] proxy error:', err.message);
    res.status(503).json({ error: 'Service unavailable', details: err.message });
  },
};

// Auth service: routes at root, so /api/auth/login -> /login
app.use(
  '/api/auth',
  createProxyMiddleware({
    ...commonProxyOptions,
    target: targets.auth,
    pathRewrite: path => path || '/',
  })
);

// User service: routes prefixed with /users, so /api/users/123 -> /users/123
app.use(
  '/api/users',
  createProxyMiddleware({
    ...commonProxyOptions,
    target: targets.user,
    pathRewrite: path => `/users${path}`, // /123 -> /users/123
  })
);

// Game service: routes prefixed with /games, so /api/games/list -> /games/list
app.use(
  '/api/games',
  createProxyMiddleware({
    ...commonProxyOptions,
    target: targets.game,
    pathRewrite: (path) => {
      // Keep /admin routes intact, map everything else to /games/*
      if (path.startsWith('/admin')) return path;
      return `/games${path}`;
    },
  })
);

// Community service: routes at root, so /api/community/games/123/posts -> /games/123/posts
app.use(
  '/api/community',
  createProxyMiddleware({
    ...commonProxyOptions,
    target: targets.community,
    pathRewrite: { '^/api/community': '' }, // strip /api/community prefix
  })
);

// Chat service: routes prefixed with /chat, so /api/chat/message -> /chat/message
app.use(
  '/api/chat',
  createProxyMiddleware({
    ...commonProxyOptions,
    target: targets.ai,
    pathRewrite: path => `/chat${path}`, // /... -> /chat/...
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
