const mongoose = require('mongoose');

// Profit subdocument schema (for both back and lay)
const profitSchema = new mongoose.Schema({
  net:        { type: Number, default: 0 },
  percentage: { type: String, default: '0%' }
}, { _id: false });

// Laying history per tip, for each runner
const layingHistorySchema = new mongoose.Schema({
  odds: {
    back: { type: Number, default: 0 },
    lay:  { type: Number, default: 0 }
  },
  Ammount: {
    back: { type: Number, default: 0 },
    lay:  { type: Number, default: 0 }
  },
  Profit: {
    back: { type: profitSchema, default: () => ({ net: 0, percentage: '0%' }) },
    lay:  { type: profitSchema, default: () => ({ net: 0, percentage: '0%' }) }
  },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Each runner odds entry per user
const runnerOddsSchema = new mongoose.Schema({
  selectionId:   { type: Number, required: true },
  runnerName:    { type: String, required: true },
  layingHistory: { type: [layingHistorySchema], default: [] }
}, { _id: false });

// User's odds/tip document schema
const userOddstipSchema = new mongoose.Schema({
  eventId:        { type: String, required: true, index: true },
  userId:         { type: String, required: true, index: true },
  runners:        { type: [runnerOddsSchema], default: [] },
  openingbalance: { type: Number, default: 0 }, // <-- Added field!
  createdAt:      { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique index on (eventId, userId)
userOddstipSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const userOddstip = mongoose.model('userOddstip', userOddstipSchema);

module.exports = userOddstip;
