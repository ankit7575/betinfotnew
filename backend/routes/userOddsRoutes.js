const express = require('express');
const router = express.Router();
const {addOrUpdateUserOdds,getUserOddsForEvent} = require('../controller/userOddsController');
const { isAuthenticatedUser,authorizeRoles } = require('../middleware/auth');

// Add/update a user's odds for a runner/event
router.post('/user-odds/:eventId/:selectionId',isAuthenticatedUser,  addOrUpdateUserOdds);

// Get all a user's odds for an event
router.get('/user-odds/:eventId',isAuthenticatedUser,  getUserOddsForEvent);

module.exports = router;
