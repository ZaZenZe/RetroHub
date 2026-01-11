'use strict';

const { Schema, model, Types } = require('mongoose');

const ACHIEVEMENT_NAMES = [
  'FIRST_POST',
  'FIRST_GAME',
  'FIVE_GAMES',
  'TEN_GAMES',
  'FIRST_REPLY',
  'HELPFUL_MEMBER',
  'AI_EXPLORER',
  'GAME_MASTER',
  'COLLECTOR',
  'COMPLETIONIST',
];

const achievementSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    enum: ACHIEVEMENT_NAMES,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  iconUrl: {
    type: String,
    required: true,
  },
  pointsValue: {
    type: Number,
    required: true,
    min: 0,
  },
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
});

achievementSchema.index({ userId: 1, name: 1 }, { unique: true });

achievementSchema.statics.findByUser = function findByUser(userId) {
  return this.find({ userId });
};

achievementSchema.statics.unlockForUser = function unlockForUser(userId, achievementName, doc = {}) {
  const payload = {
    userId,
    name: achievementName,
    description: doc.description,
    iconUrl: doc.iconUrl,
    pointsValue: doc.pointsValue,
  };
  return this.findOneAndUpdate(
    { userId, name: achievementName },
    { $setOnInsert: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = model('Achievement', achievementSchema);
