'use strict';

const { Schema, model, Types } = require('mongoose');

const userGameSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  gameId: {
    type: Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['PLAYING', 'COMPLETED', 'BACKLOG', 'WISH_LIST'],
    default: 'BACKLOG',
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
  lastPlayedDate: {
    type: Date,
    default: null,
  },
});

userGameSchema.index({ userId: 1, gameId: 1 }, { unique: true });

userGameSchema.statics.findByUser = function findByUser(userId) {
  return this.find({ userId });
};

userGameSchema.statics.findByUserAndStatus = function findByUserAndStatus(userId, status) {
  return this.find({ userId, status });
};

module.exports = model('UserGame', userGameSchema);
