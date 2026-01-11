'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { corsOptions } = require('../shared/config/cors.config');
const { verifyToken } = require('../shared/middleware/auth.middleware');
const { errorHandler } = require('../shared/middleware/error.middleware');

const PORT = process.env.PORT || 5006;
const MAX_JSON = process.env.MAX_JSON || '1mb';

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: MAX_JSON }));

app.get('/health', (req, res) => {
	res.json({ status: 'ok', service: 'ai-service' });
});

app.post('/chat', verifyToken, (req, res) => {
	res.status(501).json({ message: 'AI chat placeholder' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
	console.log(`AI service running on port ${PORT}`);
});

const gracefulShutdown = () => {
	console.log('Shutting down AI service...');
	server.close(() => {
		process.exit(0);
	});
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
