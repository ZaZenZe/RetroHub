'use strict';

const { Schema, model, Types } = require('mongoose');

const faqSchema = new Schema({
  gameId: {
    type: Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

faqSchema.index({ gameId: 1 });

faqSchema.methods.incrementViews = function incrementViews() {
  this.views += 1;
  return this.save();
};

faqSchema.statics.findByGame = function findByGame(gameId) {
  return this.find({ gameId });
};

module.exports = model('FAQ', faqSchema);
