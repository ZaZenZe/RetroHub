'use strict';

const rawEnv = process.env.CORS_ORIGIN || '';
const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = rawEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Helpful local/dev hostnames that should be allowed when testing on emulator or
// using Capacitor. This is intentionally permissive for local development only.
const additionalLocalHosts = ['10.0.2.2'];

function isLocalOrCapacitorOrigin(origin) {
  try {
    const u = new URL(origin);
    if (u.protocol === 'capacitor:') return true;
    if (u.hostname === 'localhost') return true;
    if (additionalLocalHosts.includes(u.hostname)) return true;
    return false;
  } catch (e) {
    return false;
  }
}

function originValidator(origin, callback) {
  if (isDev) return callback(null, true);
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes('*')) return callback(null, true);
  if (allowedOrigins.length && allowedOrigins.includes(origin)) return callback(null, true);
  // Allow common development origins used by Capacitor / emulator even when
  // the environment variable isn't configured.
  if (isLocalOrCapacitorOrigin(origin)) return callback(null, true);
  return callback(new Error('CORS origin not allowed'));
}

const corsOptions = {
  origin: originValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = { corsOptions };
