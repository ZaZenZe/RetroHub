'use strict';

const { Schema, model, Types } = require('mongoose');

const replySchema = new Schema({
  postId: {
    type: Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true,
  },
  upvotes: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  editedAt: {
    type: Date,
    default: null,
  },
});

replySchema.index({ postId: 1 });
replySchema.index({ userId: 1 });

replySchema.methods.upvote = function upvote() {
  this.upvotes += 1;
  return this.save();
};

replySchema.statics.findByPost = function findByPost(postId) {
  return this.find({ postId });
};

module.exports = model('Reply', replySchema);
