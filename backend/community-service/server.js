'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sharedBase = path.join(__dirname, '../shared');
const { connectWithRetry, connectionState } = require(path.join(sharedBase, 'db'));
const { corsOptions } = require(path.join(sharedBase, 'config/cors.config'));
const { errorHandler } = require(path.join(sharedBase, 'middleware/error.middleware'));
const communityRoutes = require('./routes/community.routes');

const PORT = process.env.PORT || 3004;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  const dbStatus = connectionState();
  res.json({
    status: 'ok',
    service: 'community',
    timestamp: Date.now(),
    database: {
      connected: dbStatus.connected,
      state: dbStatus.state,
    },
  });
});

app.use('/', communityRoutes);

app.use(errorHandler);

let server;

async function start() {
  await connectWithRetry();
  server = app.listen(PORT, () => {
    console.log(`[community-service] listening on port ${PORT}`);
  });
}

function shutdown(signal) {
  console.log(`[community-service] received ${signal}, shutting down...`);
  if (server) {
    server.close(() => {
      console.log('[community-service] server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

start().catch(err => {
  console.error('[community-service] failed to start', err);
  process.exit(1);
});
