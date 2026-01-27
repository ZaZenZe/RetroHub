'use strict';

const { Schema, model } = require('mongoose');

// Extend platform options to align with retro consoles and handhelds.
const PLATFORM_ENUM = [
  'Atari',
  'Amiga',
  'NES',
  'SNES',
  'GB',
  'GBC',
  'GBA',
  'N64',
  'GC',
  'Dreamcast',
  'Sega Genesis',
  'Sega Master System',
  'Sega Saturn',
  'DS',
  '3DS',
  'Wii',
  'PS1',
  'PS2',
  'PSP',
  'PlayStation',
  'PlayStation 2',
  'Arcade',
  'PC',
  'Xbox',
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
      enum: PLATFORM_ENUM,
      default: 'Other',
    },
    releaseYear: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    versionLabel: {
      type: String,
      default: '',
      trim: true,
    },
    coverImageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    coverGifUrl: {
      type: String,
      default: null,
      trim: true,
    },
    heroImageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    gameplayGifUrl: {
      type: String,
      default: null,
      trim: true,
    },
    hoverImageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    hoverGifUrl: {
      type: String,
      default: null,
      trim: true,
    },
    screenshots: {
      type: [String],
      default: [],
    },
    theme: {
      name: {
        type: String,
        default: 'retro',
        trim: true,
      },
      colors: {
        primary: { type: String, default: '#ff7b00' },
        primaryAlt: { type: String, default: '#ff9f1a' },
        accent: { type: String, default: '#4fc3f7' },
        background: { type: String, default: '#0d0e12' },
        card: { type: String, default: '#1b1f29' },
        text: { type: String, default: '#e6e6e9' },
        border: { type: String, default: '#232734' },
      },
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
