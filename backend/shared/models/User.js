'use strict';

const bcrypt = require('bcryptjs');
const { Schema, model } = require('mongoose');

const SALT_ROUNDS = 10;

/**
 * User schema: auth + profile basics.
 */
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
  },
  experiencePoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
});

// Hash password when changed
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static methods
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email });
};

module.exports = model('User', userSchema);
