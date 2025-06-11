const mongoose = require("mongoose");
const { Schema } = mongoose;

const planSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  // Specify the coin type for the plan: 'gold' or 'diamond'
  coinType: { type: String, enum: ['gold', 'diamond'], required: true },
  totalCoins: { type: Number, required: true }, // Total number of coins associated with the plan
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // For tracking updates
});

// Auto-update updatedAt field when plan is saved/updated
planSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
