'use strict';

const rawEnv = process.env.CORS_ORIGIN || '';
const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = rawEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function originValidator(origin, callback) {
  if (isDev) return callback(null, true);
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes('*')) return callback(null, true);
  if (allowedOrigins.length && allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('CORS origin not allowed'));
}

const corsOptions = {
  origin: originValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = { corsOptions };
