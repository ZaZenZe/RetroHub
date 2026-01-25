'use strict';

const { Schema, model, Types } = require('mongoose');

const postSchema = new Schema(
  {
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
    content: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isSpoiler: {
      type: Boolean,
      default: false,
    },
    // user who marked the post as a spoiler (admin/mod or owner)
    spoilerMarkedBy: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    voteMap: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.index({ gameId: 1 });
postSchema.index({ userId: 1 });

postSchema.virtual('replyCount', {
  ref: 'Reply',
  localField: '_id',
  foreignField: 'postId',
  count: true,
});

postSchema.methods.upvote = function upvote() {
  this.upvotes += 1;
  return this.save();
};

postSchema.methods.downvote = function downvote() {
  this.downvotes += 1;
  return this.save();
};

postSchema.methods.applyVote = function applyVote(userId, direction) {
  if (!userId) return this;
  const key = userId.toString();
  if (!this.voteMap) this.voteMap = new Map();
  const prev = this.voteMap.get(key);

  if (prev === direction) return this;

  if (prev === 'up') this.upvotes = Math.max(0, this.upvotes - 1);
  if (prev === 'down') this.downvotes = Math.max(0, this.downvotes - 1);

  if (direction === 'up') this.upvotes += 1;
  if (direction === 'down') this.downvotes += 1;

  this.voteMap.set(key, direction);
  return this.save();
};

postSchema.statics.findByGame = function findByGame(gameId, sortBy = '-createdAt') {
  return this.find({ gameId }).sort(sortBy);
};

module.exports = model('Post', postSchema);
