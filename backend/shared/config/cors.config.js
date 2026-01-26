'use strict';

const envOrigin = process.env.CORS_ORIGIN;
const isDev = process.env.NODE_ENV !== 'production';

const corsOptions = {
  origin: envOrigin || (isDev ? '*' : false),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = { corsOptions };
