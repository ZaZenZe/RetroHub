'use strict';

const express = require('express');
const { verifyToken } = require('../../shared/middleware/auth.middleware');
const router = express.Router();

router.get('/users/:id', verifyToken, (req, res) => {
  res.status(501).json({ message: 'Get user placeholder', userId: req.params.id });
});

router.put('/users/:id', verifyToken, (req, res) => {
  res.status(501).json({ message: 'Update user placeholder', userId: req.params.id });
});

router.get('/users/:id/stats', verifyToken, (req, res) => {
  res.status(501).json({ message: 'User stats placeholder', userId: req.params.id });
});

router.get('/users/:id/achievements', verifyToken, (req, res) => {
  res.status(501).json({ message: 'User achievements placeholder', userId: req.params.id });
});

router.post('/users/:id/games', verifyToken, (req, res) => {
  res.status(501).json({ message: 'Add user game placeholder', userId: req.params.id });
});

router.delete('/users/:id/games/:gameId', verifyToken, (req, res) => {
  res.status(501).json({ message: 'Remove user game placeholder', userId: req.params.id, gameId: req.params.gameId });
});

module.exports = router;
