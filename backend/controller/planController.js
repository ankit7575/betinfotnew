// controllers/planController.js

const mongoose = require("mongoose");
const validator = require("validator");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Plan = require("../models/planModel");
const Match = require("../models/matchModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhandler");
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

// 1. Add a new plan (now includes coinType)
exports.addPlan = catchAsyncErrors(async (req, res, next) => {
    const { name, description, price, coinType, totalCoins } = req.body;

    if (!name || !description || !price || !coinType || !totalCoins) {
      return next(new ErrorHandler('Please provide all required fields', 400));
    }
    if (!["gold", "diamond"].includes(coinType)) {
      return next(new ErrorHandler('coinType must be "gold" or "diamond"', 400));
    }
    if (typeof totalCoins !== 'number' || totalCoins <= 0) {
      return next(new ErrorHandler('Total coins must be a positive number', 400));
    }

    const plan = new Plan({ name, description, price, coinType, totalCoins });
    await plan.save();

    res.status(201).json({ success: true, plan });
});

// 2. Get all plans
exports.getAllPlans = catchAsyncErrors(async (req, res, next) => {
    const plans = await Plan.find();
    res.status(200).json({ success: true, plans });
});

// 3. Get a single plan by ID
exports.getPlanById = catchAsyncErrors(async (req, res, next) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return next(new ErrorHandler("Plan not found", 404));
    res.status(200).json({ success: true, plan });
});

// 4. Edit a plan by ID
exports.editPlan = catchAsyncErrors(async (req, res, next) => {
    const { name, description, price, coinType, totalCoins } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return next(new ErrorHandler("Plan not found", 404));

    plan.name = name ?? plan.name;
    plan.description = description ?? plan.description;
    plan.price = price ?? plan.price;
    plan.coinType = coinType ?? plan.coinType;
    plan.totalCoins = totalCoins ?? plan.totalCoins;
    await plan.save();

    res.status(200).json({ success: true, plan });
});

// 5. Delete a plan by ID
exports.deletePlan = catchAsyncErrors(async (req, res, next) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return next(new ErrorHandler("Plan not found", 404));
    await Plan.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Plan deleted successfully" });
});




// Check the expiration of the selected plan in Redis temp storage
exports.checkSelectedPlanExpiration = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  // Try to get the plan from Redis
  const tempPlanStr = await redis.get(`tempuser:plan:${userId}`);
  if (!tempPlanStr) {
    return next(new ErrorHandler("No plan selected or plan has expired", 404));
  }

  // Parse and return the planId (or the plan object you stored)
  const { planId } = JSON.parse(tempPlanStr);

  res.status(200).json({
    success: true,
    message: "Plan is still valid for transaction",
    selectedPlan: planId,
  });
});


// Clear user's temp plan (mostly for manual clean-up or debugging)
exports.clearExpiredPlans = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  const redisKey = `tempuser:plan:${userId}`;
  const tempPlanStr = await redis.get(redisKey);

  if (!tempPlanStr) {
    // Key doesn't exist, either already expired or never set
    return res.status(200).json({
      success: true,
      message: "No plan in temp store",
    });
  }

  // If plan exists, delete it
  await redis.del(redisKey);

  return res.status(200).json({
    success: true,
    message: "Plan (if any) removed from temp store",
  });
});

// CONTROLLER: Plan selection and transaction logic

// Select an activation plan temporarily for the user (stored in Redis)
exports.selectPlan = catchAsyncErrors(async (req, res, next) => {
    const { planId } = req.body;
    if (!req.user || !req.user.id) {
        return next(new ErrorHandler('User not authenticated', 401));
    }
    if (!mongoose.Types.ObjectId.isValid(planId)) {
        return next(new ErrorHandler('Invalid plan ID', 400));
    }
    const plan = await Plan.findById(planId);
    if (!plan) {
        return next(new ErrorHandler('Plan not found', 404));
    }
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }
    // Store temp plan in Redis for 90 seconds
    await redis.setex(
        `tempuser:plan:${userId}`,
        90,
        JSON.stringify({ planId })
    );
    res.status(200).json({
        success: true,
        message: 'Plan selected and stored temporarily',
        plan,
        user,
    });
});

// Add a new transaction for the selected plan
exports.addTransaction = catchAsyncErrors(async (req, res, next) => {
    const { transactionId } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User not found", 404));

    // Get temp plan from Redis
    const tempPlanStr = await redis.get(`tempuser:plan:${userId}`);
    if (!tempPlanStr) return next(new ErrorHandler("No plan selected or plan has expired", 404));
    const { planId } = JSON.parse(tempPlanStr);

    if (!transactionId) return next(new ErrorHandler("Transaction ID is required", 400));

    const plan = await Plan.findById(planId);
    if (!plan) return next(new ErrorHandler("Plan not found", 404));

    await user.addTransaction(transactionId, plan);

    // Remove temp plan from Redis
    await redis.del(`tempuser:plan:${userId}`);

    res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        user,
    });
});

// Update transaction status (admin only)
exports.updateTransactionStatus = catchAsyncErrors(async (req, res, next) => {
    const { transactionId, status } = req.body;
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler('You are not authorized to update this transaction', 403));
    }
    if (!["completed", "failed", "pending"].includes(status)) {
        return next(new ErrorHandler('Invalid status', 400));
    }

    // Find the user who has the transaction
    const user = await User.findOne({ 'transactions.transactionId': transactionId });
    if (!user) return next(new ErrorHandler('Transaction not found', 404));
    const transaction = user.transactions.find(txn => txn.transactionId === transactionId);
    if (!transaction) return next(new ErrorHandler('Transaction not found', 404));

    transaction.status = status;

    if (status === 'completed') {
        // Approve and add coins
        const plan = await Plan.findById(transaction.plan);
        if (!plan) return next(new ErrorHandler('Plan not found', 404));
        const coinsToAddArr = Array(plan.totalCoins).fill({ type: plan.coinType }); // [{type: 'gold'}, ...]
        await user.approveTransaction(transactionId, coinsToAddArr, plan._id);
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Transaction status updated successfully and coins added if completed',
        transaction,
    });
});

// Admin: get all user transactions
exports.getAllUserTransactions = catchAsyncErrors(async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler('You are not authorized to view this resource', 403));
    }
    const users = await User.find().populate('transactions.plan');
    if (!users || users.length === 0) {
        return next(new ErrorHandler('No users found', 404));
    }
    const userTransactions = users.map(user => ({
        userId: user.email,
        transactions: user.transactions.map(txn => ({
            transactionId: txn.transactionId,
            plan: txn.plan,
            status: txn.status,
            transactionDate: txn.transactionDate
        }))
    }));
    res.status(200).json({
        success: true,
        userTransactions
    });
});

// Get all transactions for a single user
exports.getUserTransactions = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate("transactions.plan");
    if (!user) return next(new ErrorHandler("User not found", 404));
    if (user.transactions.length === 0) return next(new ErrorHandler("No transactions found", 404));
    res.status(200).json({
        success: true,
        transactions: user.transactions,
    });
});


// Get the transaction status (specific transaction by transactionId)
exports.getTransactionStatus = catchAsyncErrors(async (req, res, next) => {
  const { transactionId } = req.params;

  // Log the transactionId for debugging
  console.log("Getting Status for Transaction ID:", transactionId);

  // Find the transaction by transactionId
  const transaction = await Transaction.findOne({ transactionId });

  if (!transaction) {
    return next(new ErrorHandler("Transaction not found", 404));
  }

  // Return the status of the transaction
  res.status(200).json({
    success: true,
    status: transaction.status,
    transaction,
  });
});

// --- Coin & Key Management, Redemption, Sharing ---

// Controller: Get authenticated user's keys
exports.getUserKeys = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return next(new ErrorHandler("User not found", 404));
    const keys = user.keys.map(key => ({
        id: key.id,
        shareableCode: key.shareableCode,
        plan: key.plan,
        status: key.status,
        createdAt: key.createdAt,
    }));
    res.status(200).json({
        success: true,
        keys,
    });
});

// Controller: Get all coins for the authenticated user
exports.getUserCoins = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return next(new ErrorHandler("User not found", 404));
    let allCoins = [];
    user.keys.forEach(key => {
        if (Array.isArray(key.coin)) allCoins = allCoins.concat(key.coin);
    });
    const now = new Date();
    const coinDetails = allCoins.map(coin => ({
        id: coin.id,
        shareableCode: coin.shareableCode,
        type: coin.type,
        activeAt: coin.activeAt || null,
        expiresAt: coin.expiresAt || null,
        usedAt: coin.usedAt || null,
        usedForEventId: coin.usedForEventId || null
    }));
    const activeCoins = coinDetails.filter(coin =>
        !coin.usedAt && (!coin.expiresAt || new Date(coin.expiresAt) > now)
    );
    res.status(200).json({
        success: true,
        totalCoins: coinDetails.length,
        activeCoinsCount: activeCoins.length,
        coins: coinDetails,
    });
});

// Admin: Get all users' keys and coins
exports.getAllUsersKeysAndCoins = catchAsyncErrors(async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler("Access denied. Admins only.", 403));
    }
    const users = await User.find({});
    if (!users || users.length === 0) {
        return next(new ErrorHandler("No users found", 404));
    }
    const allUsersData = users.map(user => {
        let allCoins = [];
        user.keys.forEach(key => {
            if (Array.isArray(key.coin)) allCoins = allCoins.concat(key.coin);
        });
        const now = new Date();
        const coinDetails = allCoins.map(coin => ({
            id: coin.id,
            shareableCode: coin.shareableCode,
            type: coin.type,
            activeAt: coin.activeAt || null,
            expiresAt: coin.expiresAt || null,
            usedAt: coin.usedAt || null,
            usedForEventId: coin.usedForEventId || null
        }));
        const activeCoins = coinDetails.filter(coin =>
            !coin.usedAt && (!coin.expiresAt || new Date(coin.expiresAt) > now)
        );
        const keyDetails = user.keys.map(key => ({
            id: key.id,
            shareableCode: key.shareableCode,
            status: key.status,
            createdAt: key.createdAt || null,
            plan: key.plan ? key.plan.toString() : null,
        }));
        return {
            userEmail: user.email,
            totalCoins: coinDetails.length,
            activeCoinsCount: activeCoins.length,
            coins: coinDetails,
            keys: keyDetails,
        };
    });
    res.status(200).json({
        success: true,
        usersData: allUsersData,
    });
});

// Redeem a coin for a specific match event (GOLD)
exports.redeemCoinForEvent = catchAsyncErrors(async (req, res, next) => {
    const { coinId, eventId } = req.body;
    if (!coinId || !eventId) {
        return next(new ErrorHandler("Both Coin ID and Event ID are required", 400));
    }
    const user = await User.findOne({ email: req.user.email });
    if (!user) return next(new ErrorHandler("User not found", 404));

    // Check for superuser or admin - they can access all matches without redeeming
    if (user.role === 'admin' || user.role === 'superuser') {
        return res.status(200).json({
            success: true,
            message: `No redemption needed. Role "${user.role}" has access to all matches.`,
        });
    }

    const now = new Date();

    // Prevent redeeming more than once for the same event
    const alreadyRedeemed = user.keys.some(key =>
        key.coin?.some(coin =>
            coin.usedForEventId === eventId &&
            (!coin.expiresAt || new Date(coin.expiresAt) > now)
        )
    );
    if (alreadyRedeemed) {
        return next(new ErrorHandler("Already redeemed a coin for this match.", 400));
    }

    // Find the correct, valid, unused gold coin
    let coin = null;
    user.keys.forEach(key => {
        key.coin?.forEach(c => {
            if (c.id === coinId && !c.usedAt && !c.usedForEventId && c.type === 'gold') coin = c;
        });
    });
    if (!coin) return next(new ErrorHandler("Gold coin not found or already used", 404));
    if (coin.expiresAt && new Date(coin.expiresAt) < now) {
        return next(new ErrorHandler("Coin has expired", 400));
    }
    // Redeem for this event
    coin.usedAt = now;
    coin.usedForEventId = eventId;
    coin.activeAt = now;
    coin.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    user.coinAvailable = Math.max(0, (user.coinAvailable || 0) - 1);
    await user.save();

    res.status(200).json({
        success: true,
        message: "Gold coin successfully redeemed for this match event for 24 hours.",
        redeemedCoin: {
            id: coin.id,
            shareableCode: coin.shareableCode,
            type: coin.type,
            activeAt: coin.activeAt,
            expiresAt: coin.expiresAt,
            usedAt: coin.usedAt,
            usedForEventId: coin.usedForEventId,
        }
    });
});

// Redeem a DIAMOND coin for all matches for 24 hours
// Assuming: req.body.coinId, req.body.eventId, req.user.email

exports.redeemCoinForAllMatches = catchAsyncErrors(async (req, res, next) => {
  const { coinId, eventId } = req.body;
  if (!coinId) return next(new ErrorHandler("Coin ID is required", 400));

  const user = await User.findOne({ email: req.user.email });
  if (!user) return next(new ErrorHandler("User not found", 404));

  const now = new Date();
  let coin = null;
  let coinType = 'gold'; // default fallback

  // Find the coin in the user's keys
  user.keys.forEach(key => {
    key.coin?.forEach(c => {
      if ((c.id === coinId || c._id?.toString() === coinId) && !c.usedAt) {
        coin = c;
        coinType = c.type || c.coinType || 'gold';
      }
    });
  });

  if (!coin) return next(new ErrorHandler("Coin not found or already used", 404));
  if (coin.expiresAt && new Date(coin.expiresAt) < now) {
    return next(new ErrorHandler("Coin has expired", 400));
  }

  // If Diamond: grant all access for 24h, no event restriction
  if (coinType === 'diamond') {
    coin.usedAt = now;
    coin.activeAt = now;
    coin.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    // Optionally, store on user object: user.hasDiamondAccessUntil = coin.expiresAt;
    // Or just always check for an active, used diamond coin with valid expiry

    await user.save();
    return res.status(200).json({
      success: true,
      message: "Diamond coin redeemed! You now have access to all matches for 24 hours.",
      redeemedCoin: {
        id: coin.id,
        shareableCode: coin.shareableCode,
        coinType,
        expiresAt: coin.expiresAt,
        usedAt: coin.usedAt,
      }
    });
  }

  // If Gold: allow only for the given event
  if (coinType === 'gold') {
    if (!eventId) return next(new ErrorHandler("Event ID is required for gold coin", 400));
    // Prevent double-redeem for this event
    if (coin.usedForEventId) return next(new ErrorHandler("Coin already used for this event", 400));
    coin.usedAt = now;
    coin.activeAt = now;
    coin.usedForEventId = eventId;
    coin.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    await user.save();
    return res.status(200).json({
      success: true,
      message: "Gold coin redeemed for this match! Access granted for 24 hours.",
      redeemedCoin: {
        id: coin.id,
        shareableCode: coin.shareableCode,
        coinType,
        eventId,
        expiresAt: coin.expiresAt,
        usedAt: coin.usedAt,
      }
    });
  }

  // fallback error
  return next(new ErrorHandler("Invalid coin type.", 400));
});


// Redeem a coin using a shareable code (TRANSFER)
exports.redeemSharedCoin = catchAsyncErrors(async (req, res, next) => {
    const { shareableCode } = req.body;
    if (!shareableCode) {
        return next(new ErrorHandler("Shareable code is required", 400));
    }
    const user = await User.findOne({ email: req.user.email });
    if (!user) return next(new ErrorHandler("User not found", 404));
    // Search all users for the coin with the code
    const users = await User.find();
    let originalUser = null, sharedCoin = null;
    for (let u of users) {
        u.keys.forEach(key => {
            if (Array.isArray(key.coin)) {
                key.coin.forEach(c => {
                    if (c.shareableCode === shareableCode && !c.usedAt) {
                        originalUser = u;
                        sharedCoin = c;
                    }
                });
            }
        });
    }
    if (!sharedCoin || !originalUser) {
        return next(new ErrorHandler("Coin with the provided shareable code not found", 404));
    }
    // Mark as used in original user
    const currentTime = new Date();
    sharedCoin.usedAt = currentTime;
    sharedCoin.activeAt = currentTime;
    sharedCoin.expiresAt = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    await originalUser.save();
    // Add a copy to recipient user
    user.keys.push({ coin: [sharedCoin] });
    await user.save();
    res.status(200).json({
        success: true,
        message: "Coin successfully redeemed from shareable code.",
        redeemedCoin: {
            id: sharedCoin.id,
            shareableCode: sharedCoin.shareableCode,
            type: sharedCoin.type,
            activeAt: sharedCoin.activeAt,
            expiresAt: sharedCoin.expiresAt,
            usedAt: sharedCoin.usedAt
        }
    });
});

// Check coin expiry for authenticated user (latest redeemed coin)
exports.checkCoinExpiry = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return next(new ErrorHandler("User not found", 404));
    let coin = null;
    user.keys.forEach(key => {
        if (Array.isArray(key.coin)) {
            key.coin.forEach(c => {
                if (c.usedAt) coin = c;
            });
        }
    });
    if (!coin) return next(new ErrorHandler("No redeemed coin found for this user", 400));
    const expiryTime = new Date(coin.expiresAt);
    const currentTime = new Date();
    if (expiryTime < currentTime) {
        return next(new ErrorHandler("Coin has expired", 400));
    }
    const remainingTime = expiryTime - currentTime;
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    res.status(200).json({
        success: true,
        coinId: coin.id,
        shareableCode: coin.shareableCode,
        type: coin.type,
        expiresAt: coin.expiresAt,
        remainingTime: { hours, minutes, seconds },
    });
});

// Controller to fetch match details by userId (for frontend use)
exports.getMatchDetailsForUser = catchAsyncErrors(async (req, res, next) => {
  // Find the user by their email (assuming user is authenticated)
  const user = await User.findOne({ email: req.user.email }).populate('matches'); // Populate 'matches'

  if (!user) {
      return next(new ErrorHandler("User not found", 404));
  }

  // Check if the user has a match
  const match = user.matches; // The match will be populated here

  if (!match) {
      return next(new ErrorHandler("No match found for this user", 404));
  }

  // Respond with match id and name
  res.status(200).json({
      success: true,
      matchId: match._id,  // match id
      matchName: match.name // match name, defaulted to "viewmatch"
  });
});
