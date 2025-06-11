const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const {
    getUserKeys,
    getUserCoins,
    getAllUsersKeysAndCoins,
    redeemCoinForEvent,
    redeemCoinForAllMatches,  // <-- Add this
    redeemSharedCoin,
    checkCoinExpiry,
    getMatchDetailsForUser,
} = require("../controller/planController");

// Route to get keys and coins for a user
router.get('/coins', isAuthenticatedUser, getUserCoins);
router.get('/keys', isAuthenticatedUser,getUserKeys );
router.get('/keys-coins', isAuthenticatedUser, authorizeRoles("admin"),getAllUsersKeysAndCoins );

// Route to redeem a GOLD coin for a match
router.post('/redeem/event', isAuthenticatedUser, redeemCoinForEvent);
// Route to redeem a DIAMOND or GOLD coin (unified logic)
router.post('/redeem/all', isAuthenticatedUser, redeemCoinForAllMatches);

router.post('/redeem/shared', isAuthenticatedUser, redeemSharedCoin);
router.post('/check/expiry', isAuthenticatedUser, checkCoinExpiry);
router.get('/matches/user', isAuthenticatedUser, getMatchDetailsForUser);

module.exports = router;
