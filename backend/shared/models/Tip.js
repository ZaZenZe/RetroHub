'use strict';

const { Schema, model, Types } = require('mongoose');

const tipSchema = new Schema({
  gameId: {
    type: Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['gameplay', 'strategy', 'items', 'general'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tipSchema.index({ gameId: 1 });

tipSchema.statics.findByGame = function findByGame(gameId) {
  return this.find({ gameId });
};

module.exports = model('Tip', tipSchema);
