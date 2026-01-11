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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    editedAt: {
      type: Date,
      default: null,
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

postSchema.statics.findByGame = function findByGame(gameId, sortBy = '-createdAt') {
  return this.find({ gameId }).sort(sortBy);
};

module.exports = model('Post', postSchema);
