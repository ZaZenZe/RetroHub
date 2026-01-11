'use strict';

const { Schema, model } = require('mongoose');

// Extend platform options to align with current frontend titles while keeping handhelds.
const PLATFORM_ENUM = ['GBA', 'DS', '3DS', 'SNES', 'Sega Genesis', 'PlayStation', 'Other'];

const gameSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  platform: {
    type: String,
    required: true,
    enum: PLATFORM_ENUM,
  },
  releaseYear: {
    type: Number,
    required: true,
  },
  coverImageUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

gameSchema.index({ title: 1 }, { unique: true });

gameSchema.statics.findByPlatform = function findByPlatform(platform) {
  return this.find({ platform });
};

gameSchema.statics.searchByTitle = function searchByTitle(query) {
  if (!query) return this.find({});
  return this.find({ title: new RegExp(query, 'i') });
};

module.exports = model('Game', gameSchema);
