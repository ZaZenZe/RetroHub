'use strict';

const express = require('express');
const router = express.Router();

router.get('/games', (req, res) => {
  res.status(501).json({ message: 'List games placeholder' });
});

router.get('/games/:id', (req, res) => {
  res.status(501).json({ message: 'Get game placeholder', gameId: req.params.id });
});

router.get('/games/:id/tips', (req, res) => {
  res.status(501).json({ message: 'Game tips placeholder', gameId: req.params.id });
});

router.get('/games/:id/faqs', (req, res) => {
  res.status(501).json({ message: 'Game FAQs placeholder', gameId: req.params.id });
});

module.exports = router;
