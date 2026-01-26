'use strict';

/**
 * MongoDB connection helper with retry logic.
 * @module db
 * @typedef {import('mongoose').Connection} MongooseConnection
 */
const mongoose = require('mongoose');

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];
const MAX_RETRIES = RETRY_DELAYS_MS.length;
const ALLOW_OFFLINE = (process.env.ALLOW_OFFLINE_DB || 'true').toLowerCase() === 'true';
const STATE_LABELS = ['disconnected', 'connected', 'connecting', 'disconnecting'];

let currentUri = null;
let isShuttingDown = false;
let handlersBound = false;

/**
 * Delay helper.
 * @param {number} ms milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logTroubleshootingHints(error) {
  const hints = [];

  if (!currentUri) {
    hints.push('Ensure MONGODB_URI is set in your .env files.');
  }

  if (error?.code === 18 || /auth/i.test(error?.message || '')) {
    hints.push('Authentication failed: verify username/password in MONGODB_URI.');
  }

  if (error?.name === 'MongooseServerSelectionError' || /timed out/i.test(error?.message || '')) {
    hints.push('Network/timeout: confirm Docker is running and MongoDB container is healthy.');
    hints.push('Check firewall or antivirus rules that may block ports 27017/localhost.');
  }

  if (/ENOTFOUND|ECONNREFUSED/.test(error?.message || '')) {
    hints.push('Host unreachable: confirm the MongoDB host/port in MONGODB_URI is correct.');
  }

  if (hints.length) {
    console.warn('[db] Troubleshooting hints:');
    hints.forEach(hint => console.warn(` - ${hint}`));
  }
}

function getBackoffDelayMs(attempt) {
  return RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
}

/**
 * Attempt to connect to MongoDB with limited retries.
 * @param {string} [uri=process.env.MONGODB_URI] Mongo connection string
 * @param {number} attempt current attempt number
 * @returns {Promise<MongooseConnection>}
 */
async function connectWithRetry(uri = process.env.MONGODB_URI, attempt = 1) {
  currentUri = uri || 'mongodb://localhost:27017/retrohub';

  if (!uri) {
    if (ALLOW_OFFLINE) {
      console.warn('[db] MONGODB_URI not set; offline mode enabled, skipping DB connection');
      return null;
    }
    console.warn(
      '[db] MONGODB_URI not set; falling back to local mongodb://localhost:27017/retrohub'
    );
  }

  if (isShuttingDown) {
    console.warn('[db] Shutdown in progress; skipping new connection attempts');
    return null;
  }

  try {
    await mongoose.connect(currentUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true,
    });
    console.log(`[db] Connected to MongoDB on attempt ${attempt}`);
    bindConnectionEvents();
    return mongoose.connection;
  } catch (error) {
    console.error(`[db] Connection error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
    logTroubleshootingHints(error);

    if (ALLOW_OFFLINE) {
      console.warn('[db] Offline mode enabled; continuing without DB connection.');
      return null;
    }

    if (attempt >= MAX_RETRIES) {
      console.error('[db] Max connection attempts reached. Giving up.');
      throw error;
    }

    const delay = getBackoffDelayMs(attempt);
    console.log(`[db] Retrying in ${delay / 1000}s...`);
    await wait(delay);
    return connectWithRetry(currentUri, attempt + 1);
  }
}

function bindConnectionEvents() {
  if (handlersBound) return;
  handlersBound = true;

  mongoose.connection.on('connected', () => {
    console.log('[db] Connection established');
  });

  mongoose.connection.on('error', err => {
    if (isShuttingDown) return;
    console.error(`[db] Connection error: ${err.message}`);
    logTroubleshootingHints(err);
  });

  mongoose.connection.on('disconnected', () => {
    if (isShuttingDown) return;
    console.warn('[db] Disconnected from MongoDB');
  });

  setupGracefulShutdown();
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

function connectionState() {
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    state: STATE_LABELS[state] || 'unknown',
    code: state,
  };
}

async function closeConnection() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

function setupGracefulShutdown() {
  if (setupGracefulShutdown.bound) return;
  setupGracefulShutdown.bound = true;

  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`[db] Received ${signal}; closing MongoDB connection...`);
      try {
        await closeConnection();
        console.log('[db] MongoDB connection closed gracefully');
      } catch (err) {
        console.error(`[db] Error during shutdown: ${err.message}`);
      } finally {
        process.exit(0);
      }
    });
  });
}

module.exports = {
  connectWithRetry,
  connection: mongoose.connection,
  mongoose,
  isConnected,
  connectionState,
};
