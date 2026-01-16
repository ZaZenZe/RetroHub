'use strict';

const { Schema, model } = require('mongoose');

// Extend platform options to align with retro consoles and handhelds.
const PLATFORM_ENUM = [
  'NES',
  'SNES',
  'N64',
  'GBA',
  'DS',
  '3DS',
  'Sega Genesis',
  'PlayStation',
  'PlayStation 2',
  'Arcade',
  'PC',
  'Other',
];

const gameSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
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
    description: {
      type: String,
      required: true,
    },
    versionLabel: {
      type: String,
      default: '',
      trim: true,
    },
    coverImageUrl: {
      type: String,
      required: true,
    },
    heroImageUrl: {
      type: String,
      default: null,
    },
    hoverImageUrl: {
      type: String,
      default: null,
    },
    screenshots: {
      type: [String],
      default: [],
    },
    theme: {
      type: String,
      default: 'theme-retro',
    },
  },
  { timestamps: true }
);

gameSchema.statics.findByPlatform = function findByPlatform(platform) {
  return this.find({ platform });
};

gameSchema.statics.searchByTitle = function searchByTitle(query) {
  if (!query) return this.find({});
  return this.find({ title: new RegExp(query, 'i') });
};

gameSchema.index({ slug: 1 }, { unique: true });
gameSchema.index({ title: 1 }, { unique: true });

module.exports = model('Game', gameSchema);
