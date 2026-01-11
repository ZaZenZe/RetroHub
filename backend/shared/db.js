'use strict';

/**
 * MongoDB connection helper with retry logic.
 * @module db
 * @typedef {import('mongoose').Connection} MongooseConnection
 */
const mongoose = require('mongoose');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

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
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[db] Connected to MongoDB on attempt ${attempt}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`[db] Connection error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

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
