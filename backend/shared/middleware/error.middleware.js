'use strict';

const isDev = process.env.NODE_ENV !== 'production';

function mapStatus(err) {
  if (err.name === 'ValidationError' || err.name === 'CastError') return 400;
  if (err.name === 'JsonWebTokenError') return 401;
  if (err.name === 'TokenExpiredError') return 403;
  return err.status || 500;
}

function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  const status = mapStatus(err);
  const message = err.message || 'Internal Server Error';

  if (isDev) {
    console.error('[error]', err.stack || err);
  }

  res.status(status).json({ error: message, status });
}

module.exports = { errorHandler };
