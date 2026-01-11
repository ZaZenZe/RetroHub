'use strict';

const { Schema, model, Types } = require('mongoose');

const userStatsSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  totalGames: {
    type: Number,
    default: 0,
    min: 0,
  },
  completedGames: {
    type: Number,
    default: 0,
    min: 0,
  },
  forumPosts: {
    type: Number,
    default: 0,
    min: 0,
  },
  forumReplies: {
    type: Number,
    default: 0,
    min: 0,
  },
  aiChatsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  achievementsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userStatsSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

function inc(field) {
  return async function increment() {
    this[field] += 1;
    return this.save();
  };
}

userStatsSchema.methods.incrementGames = inc('totalGames');
userStatsSchema.methods.incrementPosts = inc('forumPosts');
userStatsSchema.methods.incrementReplies = inc('forumReplies');
userStatsSchema.methods.incrementAIChats = inc('aiChatsCount');
userStatsSchema.methods.incrementAchievements = inc('achievementsCount');

module.exports = model('UserStats', userStatsSchema);
