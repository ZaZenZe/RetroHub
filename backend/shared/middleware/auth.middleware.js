'use strict';

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'demo-secret-change-me';
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    const status = err.name === 'TokenExpiredError' ? 403 : 401;
    return res.status(status).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
