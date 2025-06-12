// controllers/userOddsController.js

const axios = require("axios");
const userOddstip = require('../models/userOddsModel'); // Your Mongoose model
const Match = require('../models/matchModel');

// --- Utility: Get latest investment for this user and event ---
function getLatestUserInvestment(match, userId) {
  if (!match || !userId) return 0;
  const entry = match.userOpeningbalanceHistory
    ?.filter(e => e?.userId?.toString() === userId)
    ?.sort((a, b) => new Date(b?.date) - new Date(a?.date))[0];
  return entry?.amount || 0;
}

// --- Helper: Build Input for Net Profit API (User Only) ---
exports.buildNetProfitInputV2 = (match, userId) => {
  const selection_ids = [];
  const history = [];
  match?.matchRunners?.forEach(runner => {
    selection_ids.push(parseInt(runner.runnerId || runner.selectionId));
  });

  const userOpeningBalance = getLatestUserInvestment(match, userId);

  const userOwnOdds = match?.userOwnOdds?.find(o => o.userId?.toString() === userId);
  if (userOwnOdds && Array.isArray(userOwnOdds.runners)) {
    userOwnOdds.runners.forEach(runnerOdd =>
      (runnerOdd.layingHistory || []).forEach(tipHistory => {
        history.push({
          selection_id: parseInt(runnerOdd.selectionId),
          side: tipHistory.odds?.back ? "Back" : tipHistory.odds?.lay ? "Lay" : "",
          odd: parseFloat(tipHistory.odds?.back ?? tipHistory.odds?.lay ?? 0),
          amount: parseInt(tipHistory.Ammount?.back ?? tipHistory.Ammount?.lay ?? 0),
        });
      })
    );
  }

  // --- The correct key for the API:
  return { selection_ids, history, userOpeningBalance };
};

// --- Net Profit Calculation API ---
exports.fetchNetProfitV2 = async ({ match, tip, userId }) => {
  try {
    const input = buildNetProfitInputV2(match, userId);
    if (tip) input.history.push(tip);
    const apiUrl = `${process.env.PLAYMATE_URL}netProfit`;
    const { data } = await axios.post(
      apiUrl,
      input,
      { headers: { Authorization: `Bearer ${process.env.PLAYMATE_TOKEN}` } }
    );
    return Array.isArray(data) && data.length === 2 ? data : null;
  } catch (e) {
    console.error("fetchNetProfitV2 error:", e.message);
    return null;
  }
};

// --- Calculate Stake/Amount for given side/odds ---
exports.fetchStakeAmountV2 = async ({ side, odd, investmentLimit = 0 }) => {
  if (!side || !odd) return 0;
  try {
    const apiUrl = `${process.env.PLAYMATE_URL}getAmount`;
    const response = await axios.post(
      apiUrl,
      {
        investment_limit: parseInt(investmentLimit),
        side,
        odd: parseFloat(odd),
      },
      { headers: { Authorization: `Bearer ${process.env.PLAYMATE_TOKEN}` } }
    );
    return response?.data?.amount || 0;
  } catch (e) {
    console.error("fetchStakeAmountV2 error:", e.message);
    return 0;
  }
};

// --- Add/Update user tip odds (main controller) ---
exports.addOrUpdateUserOdds = async (req, res) => {
  try {
    const { eventId, selectionId } = req.params;
    const userId = req.user?._id?.toString();
    let { odds, Ammount } = req.body;

    if (!eventId || !selectionId || !userId) {
      return res.status(400).json({ success: false, message: "Missing params" });
    }
    if (!odds || !Ammount) {
      return res.status(400).json({ success: false, message: "Missing odds or Ammount" });
    }

    let runnerName = "Unknown Runner";
    const match = await Match.findOne({ eventId });
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }
    if (match?.matchRunners) {
      const found = match.matchRunners.find(r =>
        String(r.selectionId || r.runnerId) === String(selectionId)
      );
      if (found) runnerName = found.runnerName;
    }

    // --- Get user's ACTUAL investment (opening balance) ---
    let investmentLimit = getLatestUserInvestment(match, userId);

    // Defensive assignment
    Ammount.back = Ammount.back ?? 0;
    Ammount.lay = Ammount.lay ?? 0;

    if (!Ammount.back && odds.back) {
      Ammount.back = await fetchStakeAmountV2({ side: 'Back', odd: odds.back, investmentLimit });
    }
    if (!Ammount.lay && odds.lay) {
      Ammount.lay = await fetchStakeAmountV2({ side: 'Lay', odd: odds.lay, investmentLimit });
    }

    // -- Update userOddstip Model first --
    let userOddstipDoc = await userOddstip.findOne({ eventId, userId });
    if (!userOddstipDoc) {
      userOddstipDoc = new userOddstip({ eventId, userId, runners: [], openingbalance: investmentLimit });
    }
    // Always update openingbalance on tip submit, to stay in sync!
    userOddstipDoc.openingbalance = investmentLimit;

    let runnerOdds = userOddstipDoc.runners.find(r => r.selectionId === Number(selectionId));
    if (!runnerOdds) {
      runnerOdds = {
        selectionId: Number(selectionId),
        runnerName,
        layingHistory: [],
      };
      userOddstipDoc.runners.push(runnerOdds);
    }

    // Save the tip in user's odds history for this runner
    const tipHistory = {
      odds,
      Ammount,
      timestamp: new Date(),
    };
    runnerOdds.layingHistory.push(tipHistory);

    await userOddstipDoc.save();

    // After user odds are updated, fetch net profit using updated userOwnOdds in match object:
    const latestUserOddstip = await userOddstip.findOne({ eventId, userId });

    // Attach "userOwnOdds" to match object for profit calculation
    match.userOwnOdds = [
      {
        userId: userId,
        runners: latestUserOddstip.runners
      }
    ];

    // Profit Calculation
    const tip = {
      selection_id: Number(selectionId),
      side: odds.back ? "Back" : "Lay",
      odd: odds.back || odds.lay,
      amount: Ammount.back || Ammount.lay,
    };
    const netProfit = await fetchNetProfitV2({ match, tip, userId });

    // Always assign objects to back/lay, even if netProfit is missing
    let profitObj = {
      back: { net: 0, percentage: "0%" },
      lay: { net: 0, percentage: "0%" }
    };

    if (netProfit) {
      const amtBack = Ammount.back || 0;
      const amtLay = Ammount.lay || 0;

      let netBack = typeof netProfit[0] === "object" && netProfit[0] !== null ? netProfit[0].net : netProfit[0];
      let netLay  = typeof netProfit[1] === "object" && netProfit[1] !== null ? netProfit[1].net : netProfit[1];

      profitObj.back = {
        net: isNaN(netBack) ? 0 : Number(netBack),
        percentage: amtBack ? ((isNaN(netBack) ? 0 : Number(netBack)) / amtBack * 100).toFixed(2) + "%" : "0%"
      };
      profitObj.lay = {
        net: isNaN(netLay) ? 0 : Number(netLay),
        percentage: amtLay ? ((isNaN(netLay) ? 0 : Number(netLay)) / amtLay * 100).toFixed(2) + "%" : "0%"
      };
    }

    // Save profit into last layingHistory tip
    runnerOdds.layingHistory[runnerOdds.layingHistory.length - 1].Profit = {
      back: { ...profitObj.back },
      lay: { ...profitObj.lay }
    };

    await userOddstipDoc.save();

    // Also return user's investment amount for frontend use!
    const userInvestment = getLatestUserInvestment(match, userId);

    return res.status(200).json({
      success: true,
      userOddstip: {
        ...(userOddstipDoc?.toObject() || { runners: [] }),
        userInvestment,
        openingbalance: userOddstipDoc.openingbalance // always included for convenience
      }
    });
  } catch (error) {
    console.error("Error in addOrUpdateUserOdds:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// --- Get User's Odds for Event ---
exports.getUserOddsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id?.toString();

    if (!eventId || !userId) {
      return res.status(400).json({ success: false, message: "Missing params" });
    }

    const match = await Match.findOne({ eventId });
    const userOddstipDoc = await userOddstip.findOne({ eventId, userId });
    const userInvestment = getLatestUserInvestment(match, userId);

    // If mismatch (investment changed in Match), update the tip doc for consistency!
    if (userOddstipDoc && userOddstipDoc.openingbalance !== userInvestment) {
      userOddstipDoc.openingbalance = userInvestment;
      await userOddstipDoc.save();
    }

    return res.status(200).json({
      success: true,
      userOddstip: {
        ...(userOddstipDoc?.toObject() || { runners: [] }),
        userInvestment,
        openingbalance: userOddstipDoc?.openingbalance || userInvestment
      }
    });
  } catch (error) {
    console.error("Error in getUserOddsForEvent:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// --- Add User Investment (Opening Balance) ---
exports.userAddInvestment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id?.toString();
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "A valid amount is required." });
    }

    const match = await Match.findOne({ eventId });
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found." });
    }

    // Remove any existing history for this user
    match.userOpeningbalanceHistory = match.userOpeningbalanceHistory.filter(entry => entry.userId.toString() !== userId);

    match.userOpeningbalanceHistory.push({
      userId,
      amount,
      date: new Date(),
    });

    await match.save();

    // --- ALSO update or create userOddstip.openingbalance ---
    let userOddstipDoc = await userOddstip.findOne({ eventId, userId });
    if (!userOddstipDoc) {
      userOddstipDoc = new userOddstip({ eventId, userId, runners: [], openingbalance: amount });
    } else {
      userOddstipDoc.openingbalance = amount;
    }
    await userOddstipDoc.save();

    res.status(200).json({
      success: true,
      message: "User investment added.",
      userId,
      eventId,
      openingbalance: amount
    });
  } catch (error) {
    console.error("Error in userAddInvestment:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
