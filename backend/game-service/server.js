'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectWithRetry } = require('../shared/db');
const { corsOptions } = require('../shared/config/cors.config');
const { errorHandler } = require('../shared/middleware/error.middleware');
const gameRoutes = require('./routes/game.routes');

const PORT = process.env.PORT || 3003;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ status: 'ok', service: 'game', timestamp: Date.now() });
});

app.use('/', gameRoutes);

app.use(errorHandler);

let server;

async function start() {
	await connectWithRetry();
	server = app.listen(PORT, () => {
		console.log(`[game-service] listening on port ${PORT}`);
	});
}

function shutdown(signal) {
	console.log(`[game-service] received ${signal}, shutting down...`);
	if (server) {
		server.close(() => {
			console.log('[game-service] server closed');
			process.exit(0);
		});
	} else {
		process.exit(0);
	}
}

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

start().catch(err => {
	console.error('[game-service] failed to start', err);
	process.exit(1);
});
