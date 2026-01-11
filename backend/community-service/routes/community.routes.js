'use strict';

const express = require('express');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const router = express.Router();

router.get('/games/:gameId/posts', (req, res) => {
  res.status(501).json({ message: 'List posts placeholder', gameId: req.params.gameId });
});

router.post('/games/:gameId/posts', verifyToken, (req, res) => {
  res.status(501).json({ message: 'Create post placeholder', gameId: req.params.gameId });
});

router.get('/posts/:postId/replies', (req, res) => {
  res.status(501).json({ message: 'List replies placeholder', postId: req.params.postId });
});

router.post('/posts/:postId/replies', verifyToken, (req, res) => {
  res.status(501).json({ message: 'Create reply placeholder', postId: req.params.postId });
});

router.post('/posts/:postId/vote', verifyToken, (req, res) => {
  res.status(501).json({ message: 'Vote placeholder', postId: req.params.postId });
});

module.exports = router;
