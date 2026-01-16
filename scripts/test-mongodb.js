'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/retrohub';
const TIMEOUT_MS = 10000;
const TEST_COLLECTION = 'connection_test';

const errCleanup = [];

const SYMBOLS = {
  ok: '\u2713', // ✓ required by spec
  fail: '\u2717', // ✗ required by spec
};

function logStep(ok, message) {
  const prefix = ok ? SYMBOLS.ok : SYMBOLS.fail;
  console.log(`${prefix} ${message}`);
}

function timeoutAfter(ms, message) {
  return new Promise((_, reject) => {
    const id = setTimeout(() => {
      const err = new Error(message);
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
    // ensure timer can be cleared by whoever wins the race
    errCleanup.push(() => clearTimeout(id));
  });
}

async function connectWithTimeout(uri) {
  const conn = mongoose.createConnection();
  conn.on('error', err => logStep(false, `Connection error: ${err.message}`));
  await Promise.race([
    conn.openUri(uri, {
      serverSelectionTimeoutMS: TIMEOUT_MS,
      connectTimeoutMS: TIMEOUT_MS,
      retryWrites: true,
    }),
    timeoutAfter(TIMEOUT_MS, `Connection timed out after ${TIMEOUT_MS / 1000}s`),
  ]);
  while (errCleanup.length) {
    const cleanup = errCleanup.pop();
    try {
      cleanup();
    } catch (e) {
      // ignore
    }
  }
  return conn;
}

function logTroubleshooting(error) {
  const hints = [];
  if (error?.code === 18 || /auth/i.test(error?.message || '')) {
    hints.push('Authentication failed: verify credentials in MONGODB_URI.');
  }
  if (error?.code === 'TIMEOUT' || /timeout/i.test(error?.message || '')) {
    hints.push('Network/timeout: ensure Docker is running and MongoDB container is healthy.');
    hints.push('Check firewall/antivirus rules for port 27017.');
  }
  if (/ENOTFOUND|ECONNREFUSED/.test(error?.message || '')) {
    hints.push('Host unreachable: confirm the host/port in MONGODB_URI.');
  }
  if (!process.env.MONGODB_URI) {
    hints.push('MONGODB_URI not set; using fallback mongodb://localhost:27017/retrohub.');
  }
  if (hints.length) {
    console.warn('Troubleshooting hints:');
    hints.forEach(hint => console.warn(` - ${hint}`));
  }
}

async function main() {
  let connection;
  try {
    console.log('Starting MongoDB connection test...');
    connection = await connectWithTimeout(MONGODB_URI);
    logStep(true, `Connected to MongoDB (${MONGODB_URI})`);

    const db = connection.db;

    const doc = { test: true, timestamp: Date.now() };
    await db.collection(TEST_COLLECTION).insertOne(doc);
    logStep(true, `Inserted test document into ${TEST_COLLECTION}`);

    const found = await db.collection(TEST_COLLECTION).findOne({ test: true });
    if (found) {
      logStep(true, 'Read test document back successfully');
    } else {
      throw new Error('Failed to read inserted test document');
    }

    await db.dropCollection(TEST_COLLECTION).catch(() => {});
    logStep(true, `Dropped collection ${TEST_COLLECTION}`);

    await connection.close();
    logStep(true, 'Closed MongoDB connection');

    console.log('MongoDB connection test completed successfully');
    process.exit(0);
  } catch (error) {
    logStep(false, `MongoDB test failed: ${error.message}`);
    logTroubleshooting(error);
    if (connection) {
      await connection.close().catch(() => {});
    }
    process.exit(1);
  } finally {
    while (errCleanup.length) {
      const cleanup = errCleanup.pop();
      try {
        cleanup();
      } catch (e) {
        // ignore cleanup errors
      }
    }
  }
}

main();
