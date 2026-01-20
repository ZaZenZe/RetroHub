'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sharedBase = path.join(__dirname, '../shared');
const { connectWithRetry, connectionState } = require(path.join(sharedBase, 'db'));
const { corsOptions } = require(path.join(sharedBase, 'config/cors.config'));
const { errorHandler } = require(path.join(sharedBase, 'middleware/error.middleware'));
const authRoutes = require('./routes/auth.routes');

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  const dbStatus = connectionState();
  res.json({
    status: 'ok',
    service: 'auth',
    timestamp: Date.now(),
    database: {
      connected: dbStatus.connected,
      state: dbStatus.state,
    },
  });
});

app.use('/', authRoutes);

app.use(errorHandler);

let server;

async function start() {
  await connectWithRetry();
  server = app.listen(PORT, () => {
    console.log(`[auth-service] listening on port ${PORT}`);
  });
}

function shutdown(signal) {
  console.log(`[auth-service] received ${signal}, shutting down...`);
  if (server) {
    server.close(() => {
      console.log('[auth-service] server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

start().catch(err => {
  console.error('[auth-service] failed to start', err);
  process.exit(1);
});
