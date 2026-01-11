'use strict';

/**
 * MongoDB connection helper with retry logic.
 * @module db
 * @typedef {import('mongoose').Connection} MongooseConnection
 */
const mongoose = require('mongoose');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const ALLOW_OFFLINE = (process.env.ALLOW_OFFLINE_DB || 'true').toLowerCase() === 'true';

/**
 * Delay helper.
 * @param {number} ms milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempt to connect to MongoDB with limited retries.
 * @param {string} [uri=process.env.MONGODB_URI] Mongo connection string
 * @param {number} attempt current attempt number
 * @returns {Promise<MongooseConnection>}
 */
async function connectWithRetry(uri = process.env.MONGODB_URI, attempt = 1) {
  const resolvedUri = uri || 'mongodb://localhost:27017/retrohub';

  if (!uri) {
    if (ALLOW_OFFLINE) {
      console.warn('[db] MONGODB_URI not set; offline mode enabled, skipping DB connection');
      return null;
    }
    console.warn(
      '[db] MONGODB_URI not set; falling back to local mongodb://localhost:27017/retrohub'
    );
  }

  try {
    await mongoose.connect(resolvedUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[db] Connected to MongoDB on attempt ${attempt}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`[db] Connection error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

    if (ALLOW_OFFLINE) {
      console.warn('[db] Offline mode enabled; continuing without DB connection.');
      return null;
    }

    if (attempt >= MAX_RETRIES) {
      console.error('[db] Max connection attempts reached. Giving up.');
      throw error;
    }

    console.log(`[db] Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
    await wait(RETRY_DELAY_MS);
    return connectWithRetry(uri, attempt + 1);
  }
}

module.exports = {
  connectWithRetry,
  connection: mongoose.connection,
  mongoose,
};
