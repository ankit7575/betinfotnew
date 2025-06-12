const express = require('express');
const router = express.Router();

const {
  getMatches,
  getMatchById,
  getBetfairOddsForRunner,
  getScoreboardByEventId,
  getMatchDetailsWithTip,
  manageUserInvestment,
  autoCalculateAdminBetfairOddsForRunner,
getSoccerMatches,
  viewAdminLayingDataForRunnerLatest,
  viewAdminLayingDataForRunnerHistory,
updateUserOddsWithHistory,
  addAdminBetfairOdds,
  getUserMatchOddsAndInvestment,
  userAddInvestment,
  adminAddInvestment,
getTennisMatches,
updateMatchSelectedStatus,
updateMatchAdminStatus,
addUserBetfairOdds,
} = require('../controller/matchController');


const { isAuthenticatedUser,authorizeRoles } = require('../middleware/auth');

// ✅ Get all matches for a sport
// Endpoint: GET /api/v1/match/sport/:sportId
router.get('/matches/:sportId',  getMatches);
router.get('/tennis', getTennisMatches);
router.get('/soccer', getSoccerMatches);

// For selected
router.post('/update-selected', updateMatchSelectedStatus);

// For admin status
router.post('/update-admin-status', updateMatchAdminStatus);
// ✅ Get single match by eventId
// Endpoint: GET /api/v1/match/:eventId
router.get('/match/:eventId', isAuthenticatedUser, getMatchById);

// ✅ Get odds for a specific runner
// Endpoint: GET /api/v1/match/:eventId/runner/:selectionId/odds
router.get("/betfair-odds/:eventId",  getBetfairOddsForRunner);

// ✅ Get scoreboard by eventId
// Endpoint: GET /api/v1/match/scoreboard/:eventId
router.get('/scoreboard/:eventId', isAuthenticatedUser, getScoreboardByEventId); // 👈 NEW ROUTE

// ✅ Fetch match details with tip when user clicks on "View Tip"
// Endpoint: GET /api/v1/match/match-details/:eventId
router.get('/match-details/:eventId', isAuthenticatedUser, getMatchDetailsWithTip);


// ✅ Manage user investment (adjust investment amount)
// Endpoint: PUT /api/v1/match/user-investment/:userId
router.put('/user/investment', isAuthenticatedUser, manageUserInvestment);

// ✅ Auto calculate Admin Betfair odds for a runner based on investment
// Endpoint: PUT /api/v1/match/admin-betfair-odds/:eventId/runner/:selectionId
router.put('/admin-betfair-odds/:eventId/runner/:selectionId', isAuthenticatedUser, autoCalculateAdminBetfairOddsForRunner);



// View the latest admin laying data for a runner
router.get('/match/:eventId/runner/:selectionId/laying', viewAdminLayingDataForRunnerLatest);

// View the admin laying history for a runner
router.get('/match/:eventId/runner/:selectionId/laying/history', viewAdminLayingDataForRunnerHistory);




router.post('/admin/match/:eventId/runner/:selectionId/odds',isAuthenticatedUser, authorizeRoles("admin"), addAdminBetfairOdds);
router.post('/user/:userId/match/:eventId/runner/:selectionId/odds',isAuthenticatedUser, addUserBetfairOdds);
router.get('/match/:eventId/my-odds', isAuthenticatedUser, getUserMatchOddsAndInvestment);
router.post('/match/:eventId/my-odds', isAuthenticatedUser, updateUserOddsWithHistory); 

router.post('/match/:eventId/user/investment',isAuthenticatedUser, userAddInvestment);
router.post('/match/:eventId/admin/investment',isAuthenticatedUser, authorizeRoles("admin"), adminAddInvestment);


module.exports = router;
