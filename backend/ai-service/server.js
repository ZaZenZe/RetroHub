'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { corsOptions } = require('./shared/config/cors.config');
const { errorHandler } = require('./shared/middleware/error.middleware');
const aiRoutes = require('./routes/ai.routes');

const PORT = process.env.PORT || 3005;
const MAX_JSON = process.env.MAX_JSON || '1mb';

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: MAX_JSON }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai', timestamp: Date.now() });
});

app.use('/', aiRoutes);

app.use(errorHandler);

let server;

function start() {
  server = app.listen(PORT, () => {
    console.log(`[ai-service] listening on port ${PORT}`);
  });
}

function gracefulShutdown(signal) {
  console.log(`[ai-service] received ${signal}, shutting down...`);
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => gracefulShutdown(sig)));

start();
