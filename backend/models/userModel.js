// models/userModel.js
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Plan = require("./planModel");

// --- Coin Schema (Support for 'gold' and 'diamond') ---
const coinSchema = new Schema({
  id: { type: String, required: true }, // Unique coin ID
  shareableCode: { type: String, required: true },
  type: { type: String, enum: ['gold', 'diamond'], required: true }, // <--- COIN TYPE
  activeAt: { type: Date },
  expiresAt: { type: Date }, // Set when redeemed
  usedAt: { type: Date, default: null }, // When redeemed
  usedForEventId: { type: String, default: null }, // For 'gold': eventId; for 'diamond': null
});

// --- Key Schema ---
const keySchema = new Schema({
  id: { type: String, required: true },
  shareableCode: { type: String, required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  coin: [coinSchema],
});

keySchema.virtual('formattedCreatedAt').get(function () {
  return this.createdAt.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true,
  });
});

// --- Transaction Schema ---
const transactionSchema = new Schema({
  transactionId: { type: String, required: true },
  userId: { type: String, required: true }, // User email
  plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionDate: { type: Date, default: Date.now },
});

// --- User Schema ---
const userSchema = new Schema({
  name:{type: String,
    required: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+\d{7,18}$/, "Please enter a valid phone number with country code (e.g., +911234567890)"],
  },
  isActive: { type: Boolean, default: true },
  // ---- ROLES: 'user', 'admin', 'superuser'
  role: { type: String, enum: ['user', 'admin', 'superuser'], default: 'user' },
  keys: [keySchema],
  transactions: [transactionSchema],
  keysAvailable: { type: Number, default: 0 },
  coinAvailable: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// --- Middleware: Hash password before save if modified ---
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// --- User Methods ---

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

// Add a transaction
userSchema.methods.addTransaction = function (transactionId, plan) {
  this.transactions.push({
    transactionId,
    userId: this.email,
    plan,
    status: 'pending',
    transactionDate: new Date(),
  });
  return this.save();
};

/**
 * Approve a transaction and assign coins
 * @param {string} transactionId
 * @param {Array<{type: 'gold'|'diamond'}>} coinsToAddArr  // EX: [{type: 'gold'}, {type: 'diamond'}]
 * @param {string} planId
 */
userSchema.methods.approveTransaction = async function (transactionId, coinsToAddArr, planId) {
  const txn = this.transactions.find(t => t.transactionId === transactionId);
  if (!txn) throw new Error('Transaction not found');
  const plan = await Plan.findById(planId);
  if (!plan) throw new Error('Plan not found');
  txn.status = 'completed';

  // Generate coins for the plan, supporting type
  const coins = coinsToAddArr.map((coinObj, i) => ({
    id: `coin-${Date.now()}-${i}`,
    shareableCode: `COIN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    type: coinObj.type,  // <--- assign 'gold' or 'diamond'
    activeAt: null,
    expiresAt: null,
    usedAt: null,
    usedForEventId: null,
  }));

  const key = {
    id: `key-${Date.now()}`,
    shareableCode: `KEY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    plan: plan._id,
    status: 'active',
    createdAt: new Date(),
    coin: coins,
  };

  this.keys.push(key);
  this.keysAvailable += 1;
  this.coinAvailable += coinsToAddArr.length;
  await this.save();
  return this;
};

// Reject a transaction
userSchema.methods.rejectTransaction = function (transactionId) {
  const txn = this.transactions.find(t => t.transactionId === transactionId);
  if (!txn) throw new Error('Transaction not found');
  txn.status = 'rejected';
  return this.save();
};

/**
 * Redeem a coin
 * GOLD: Only one event, per coin
 * DIAMOND: For all matches, for 24h (usedForEventId is null)
 * Usage: user.redeemCoin({ coinId, type: 'gold', eventId }) OR { coinId, type: 'diamond' }
 */
userSchema.methods.redeemCoin = function ({ coinId, type, eventId }) {
  for (const key of this.keys) {
    for (const coin of key.coin) {
      if (
        coin.id === coinId &&
        coin.type === type &&
        !coin.usedAt
      ) {
        const now = new Date();
        coin.usedAt = now;
        coin.activeAt = now;
        coin.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        if (type === 'gold') {
          if (!eventId) throw new Error('Gold coin requires eventId');
          coin.usedForEventId = eventId;
        } else {
          coin.usedForEventId = null; // Diamond: for all events
        }

        this.coinAvailable = Math.max(0, (this.coinAvailable || 0) - 1);

        return this.save().then(() => ({
          success: true,
          message: `Coin (${type}) successfully redeemed.`,
          redeemedCoin: coin
        }));
      }
    }
  }
  throw new Error('Coin not found or already used/redeemed.');
};

// --- ACCESS CHECK METHODS ---
// For admin/superuser: always access
// For Diamond coin: access all events for 24h
// For Gold coin: access specific event for 24h
userSchema.methods.hasValidAccessForEvent = function (eventId) {
  const now = new Date();

  // --- Admin or Superuser: always access ---
  if (this.role === 'admin' || this.role === 'superuser') {
    return { access: true, type: this.role, expiresAt: null }; // no expiry for admins/superusers
  }

  // --- Diamond Coin: access all events during 24h ---
  for (const key of this.keys) {
    for (const coin of key.coin) {
      if (
        coin.type === 'diamond' &&
        coin.usedAt &&
        coin.expiresAt &&
        new Date(coin.expiresAt) > now
      ) {
        return { access: true, type: 'diamond', expiresAt: coin.expiresAt };
      }
    }
  }
  // --- Gold Coin: per event during 24h ---
  for (const key of this.keys) {
    for (const coin of key.coin) {
      if (
        coin.type === 'gold' &&
        coin.usedForEventId === eventId &&
        coin.usedAt &&
        coin.expiresAt &&
        new Date(coin.expiresAt) > now
      ) {
        return { access: true, type: 'gold', expiresAt: coin.expiresAt };
      }
    }
  }
  return { access: false };
};

// Count all coins available for use (unused)
userSchema.methods.countActiveCoins = function () {
  let count = 0;
  for (const key of this.keys) {
    for (const coin of key.coin) {
      if (!coin.usedAt) count++;
    }
  }
  return count;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
