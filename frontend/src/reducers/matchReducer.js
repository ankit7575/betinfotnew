import {
  GET_MATCHES_REQUEST, GET_MATCHES_SUCCESS, GET_MATCHES_FAIL,
  GET_MATCH_BY_ID_REQUEST, GET_MATCH_BY_ID_SUCCESS, GET_MATCH_BY_ID_FAIL,
  GET_TENNIS_MATCHES_REQUEST, GET_TENNIS_MATCHES_SUCCESS, GET_TENNIS_MATCHES_FAIL,
  GET_SOCCER_MATCHES_REQUEST, GET_SOCCER_MATCHES_SUCCESS, GET_SOCCER_MATCHES_FAIL,
  GET_BETFAIR_ODDS_FOR_RUNNER_REQUEST, GET_BETFAIR_ODDS_FOR_RUNNER_SUCCESS, GET_BETFAIR_ODDS_FOR_RUNNER_FAIL,
  GET_SCOREBOARD_BY_EVENT_ID_REQUEST, GET_SCOREBOARD_BY_EVENT_ID_SUCCESS, GET_SCOREBOARD_BY_EVENT_ID_FAIL,
  GET_MATCH_DETAILS_WITH_TIP_REQUEST, GET_MATCH_DETAILS_WITH_TIP_SUCCESS, GET_MATCH_DETAILS_WITH_TIP_FAIL,
  MANAGE_USER_INVESTMENT_REQUEST, MANAGE_USER_INVESTMENT_SUCCESS, MANAGE_USER_INVESTMENT_FAIL,
  AUTO_CALCULATE_ADMIN_BETFAIR_ODDS_REQUEST, AUTO_CALCULATE_ADMIN_BETFAIR_ODDS_SUCCESS, AUTO_CALCULATE_ADMIN_BETFAIR_ODDS_FAIL,
  UPDATE_ADMIN_LAYING_DATA_REQUEST, UPDATE_ADMIN_LAYING_DATA_SUCCESS, UPDATE_ADMIN_LAYING_DATA_FAIL,
  VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_LATEST_REQUEST, VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_LATEST_SUCCESS, VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_LATEST_FAIL,
  VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_HISTORY_REQUEST, VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_HISTORY_SUCCESS, VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_HISTORY_FAIL,
  EDIT_ADMIN_LAYING_DATA_FOR_RUNNER_REQUEST, EDIT_ADMIN_LAYING_DATA_FOR_RUNNER_SUCCESS, EDIT_ADMIN_LAYING_DATA_FOR_RUNNER_FAIL,
  DELETE_ADMIN_LAYING_DATA_FOR_RUNNER_REQUEST, DELETE_ADMIN_LAYING_DATA_FOR_RUNNER_SUCCESS, DELETE_ADMIN_LAYING_DATA_FOR_RUNNER_FAIL,
  GENERATE_AUTO_ODDS_REQUEST, GENERATE_AUTO_ODDS_SUCCESS, GENERATE_AUTO_ODDS_FAIL,
  ADD_ADMIN_BETFAIR_ODDS_REQUEST, ADD_ADMIN_BETFAIR_ODDS_SUCCESS, ADD_ADMIN_BETFAIR_ODDS_FAIL,
  GET_USER_MATCH_ODDS_INVESTMENT_REQUEST, GET_USER_MATCH_ODDS_INVESTMENT_SUCCESS, GET_USER_MATCH_ODDS_INVESTMENT_FAIL,
  USER_UPDATE_ODDS_REQUEST, USER_UPDATE_ODDS_SUCCESS, USER_UPDATE_ODDS_FAIL,
  USER_ADD_INVESTMENT_REQUEST, USER_ADD_INVESTMENT_SUCCESS, USER_ADD_INVESTMENT_FAIL,
  UPDATE_MATCH_SELECTED_STATUS_REQUEST, UPDATE_MATCH_SELECTED_STATUS_SUCCESS, UPDATE_MATCH_SELECTED_STATUS_FAIL,
  UPDATE_MATCH_ADMIN_STATUS_REQUEST, UPDATE_MATCH_ADMIN_STATUS_SUCCESS, UPDATE_MATCH_ADMIN_STATUS_FAIL,
  CLEAR_ERRORS, ADMIN_ADD_INVESTMENT_REQUEST, ADMIN_ADD_INVESTMENT_SUCCESS, ADMIN_ADD_INVESTMENT_FAIL, ADD_USER_BETFAIR_ODDS_REQUEST, ADD_USER_BETFAIR_ODDS_SUCCESS, ADD_USER_BETFAIR_ODDS_FAIL
} from "../constants/matchConstants";

const initialState = {
  matches: [],
  match: null,
  odds: null,
  tennisMatches: [],
  soccerMatches: [],
  scoreboard: null,
  matchDetails: null,
  userInvestment: null,
  userOddsAndInvestment: null,
  adminBetfairOdds: null,
  layingDataForRunnerLatest: null,
  layingDataForRunnerHistory: null,
  adminInvestment: null,
  userBetfairOdds: null,
  // Loading flags
  loadingUserOdds: false,
  loadingAdminInvestment: false,
  loadingMatches: false,
  loadingMatch: false,
  loadingOdds: false,
  loadingScoreboard: false,
  loadingMatchDetails: false,
  loadingUserInvestment: false,
  loadingAdminOdds: false,
  loadingLayingData: false,
  loadingTennisMatches: false,
  loadingSoccerMatches: false,
  loadingUserMatchOddsInvestment: false,
  loadingUpdate: false,

  error: null,
};

export const matchReducer = (state = initialState, action) => {
  switch (action.type) {
    // === Matches List ===
    case GET_MATCHES_REQUEST:
      return { ...state, loadingMatches: true, error: null };
    case GET_MATCHES_SUCCESS:
      return { ...state, loadingMatches: false, matches: action.payload };
    case GET_MATCHES_FAIL:
      return { ...state, loadingMatches: false, error: action.payload };

    // === Single Match (by ID) ===
    case GET_MATCH_BY_ID_REQUEST:
      return { ...state, loadingMatch: true, error: null };
    case GET_MATCH_BY_ID_SUCCESS:
      return { ...state, loadingMatch: false, match: action.payload };
    case GET_MATCH_BY_ID_FAIL:
      return { ...state, loadingMatch: false, error: action.payload };

    // === Tennis & Soccer Matches ===
    case GET_TENNIS_MATCHES_REQUEST:
      return { ...state, loadingTennisMatches: true, error: null };
    case GET_TENNIS_MATCHES_SUCCESS:
      return { ...state, loadingTennisMatches: false, tennisMatches: action.payload };
    case GET_TENNIS_MATCHES_FAIL:
      return { ...state, loadingTennisMatches: false, error: action.payload };

    case GET_SOCCER_MATCHES_REQUEST:
      return { ...state, loadingSoccerMatches: true, error: null };
    case GET_SOCCER_MATCHES_SUCCESS:
      return { ...state, loadingSoccerMatches: false, soccerMatches: action.payload };
    case GET_SOCCER_MATCHES_FAIL:
      return { ...state, loadingSoccerMatches: false, error: action.payload };

    // === Odds ===
    case GET_BETFAIR_ODDS_FOR_RUNNER_REQUEST:
    case GENERATE_AUTO_ODDS_REQUEST:
      return { ...state, loadingOdds: true, error: null };
    case GET_BETFAIR_ODDS_FOR_RUNNER_SUCCESS:
    case GENERATE_AUTO_ODDS_SUCCESS:
      return { ...state, loadingOdds: false, odds: action.payload };
    case GET_BETFAIR_ODDS_FOR_RUNNER_FAIL:
    case GENERATE_AUTO_ODDS_FAIL:
      return { ...state, loadingOdds: false, error: action.payload };

    // === Scoreboard ===
    case GET_SCOREBOARD_BY_EVENT_ID_REQUEST:
      return { ...state, loadingScoreboard: true, error: null };
    case GET_SCOREBOARD_BY_EVENT_ID_SUCCESS:
      return { ...state, loadingScoreboard: false, scoreboard: action.payload };
    case GET_SCOREBOARD_BY_EVENT_ID_FAIL:
      return { ...state, loadingScoreboard: false, error: action.payload };

    // === Match Details with Tip ===
    case GET_MATCH_DETAILS_WITH_TIP_REQUEST:
      return { ...state, loadingMatchDetails: true, error: null };
    case GET_MATCH_DETAILS_WITH_TIP_SUCCESS:
      return { ...state, loadingMatchDetails: false, matchDetails: action.payload };
    case GET_MATCH_DETAILS_WITH_TIP_FAIL:
      return { ...state, loadingMatchDetails: false, error: action.payload };

    // === User Investment ===
    case MANAGE_USER_INVESTMENT_REQUEST:
    case USER_ADD_INVESTMENT_REQUEST:
      return { ...state, loadingUserInvestment: true, error: null };
    case MANAGE_USER_INVESTMENT_SUCCESS:
    case USER_ADD_INVESTMENT_SUCCESS:
      return { ...state, loadingUserInvestment: false, userInvestment: action.payload };
    case MANAGE_USER_INVESTMENT_FAIL:
    case USER_ADD_INVESTMENT_FAIL:
      return { ...state, loadingUserInvestment: false, error: action.payload };
   
    case ADMIN_ADD_INVESTMENT_REQUEST:
      return { ...state, loadingAdminInvestment: true, error: null };
    case ADMIN_ADD_INVESTMENT_SUCCESS:
      return { ...state, loadingAdminInvestment: false, adminInvestment: action.payload };
    case ADMIN_ADD_INVESTMENT_FAIL:
      return { ...state, loadingAdminInvestment: false, error: action.payload };

    // === Admin Odds ===
    case AUTO_CALCULATE_ADMIN_BETFAIR_ODDS_REQUEST:
    case ADD_ADMIN_BETFAIR_ODDS_REQUEST:
      return { ...state, loadingAdminOdds: true, error: null };
    case AUTO_CALCULATE_ADMIN_BETFAIR_ODDS_SUCCESS:
    case ADD_ADMIN_BETFAIR_ODDS_SUCCESS:
      return { ...state, loadingAdminOdds: false, adminBetfairOdds: action.payload };
    case AUTO_CALCULATE_ADMIN_BETFAIR_ODDS_FAIL:
    case ADD_ADMIN_BETFAIR_ODDS_FAIL:
      return { ...state, loadingAdminOdds: false, error: action.payload };
  
    case ADD_USER_BETFAIR_ODDS_REQUEST:
      return { ...state, loadingUserOdds: true, error: null };
    case ADD_USER_BETFAIR_ODDS_SUCCESS:
      return { ...state, loadingUserOdds: false, userBetfairOdds: action.payload };
    case ADD_USER_BETFAIR_ODDS_FAIL:
      return { ...state, loadingUserOdds: false, error: action.payload };

    // === Laying Data (Admin, Runner) ===
    case UPDATE_ADMIN_LAYING_DATA_REQUEST:
    case EDIT_ADMIN_LAYING_DATA_FOR_RUNNER_REQUEST:
    case DELETE_ADMIN_LAYING_DATA_FOR_RUNNER_REQUEST:
    case VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_LATEST_REQUEST:
    case VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_HISTORY_REQUEST:
      return { ...state, loadingLayingData: true, error: null };
    case UPDATE_ADMIN_LAYING_DATA_SUCCESS:
    case EDIT_ADMIN_LAYING_DATA_FOR_RUNNER_SUCCESS:
      return { ...state, loadingLayingData: false, layingDataForRunnerLatest: action.payload };
    case DELETE_ADMIN_LAYING_DATA_FOR_RUNNER_SUCCESS:
      return { ...state, loadingLayingData: false, layingDataForRunnerLatest: null };
    case VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_LATEST_SUCCESS:
      return { ...state, loadingLayingData: false, layingDataForRunnerLatest: action.payload };
    case VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_HISTORY_SUCCESS:
      return { ...state, loadingLayingData: false, layingDataForRunnerHistory: action.payload };
    case UPDATE_ADMIN_LAYING_DATA_FAIL:
    case EDIT_ADMIN_LAYING_DATA_FOR_RUNNER_FAIL:
    case DELETE_ADMIN_LAYING_DATA_FOR_RUNNER_FAIL:
    case VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_LATEST_FAIL:
    case VIEW_ADMIN_LAYING_DATA_FOR_RUNNER_HISTORY_FAIL:
      return { ...state, loadingLayingData: false, error: action.payload };

    // === User Match Odds + Investment (used for full page with both) ===
    case GET_USER_MATCH_ODDS_INVESTMENT_REQUEST:
      return { ...state, loadingUserMatchOddsInvestment: true, error: null };
    case GET_USER_MATCH_ODDS_INVESTMENT_SUCCESS:
      return { ...state, loadingUserMatchOddsInvestment: false, userOddsAndInvestment: action.payload };
    case GET_USER_MATCH_ODDS_INVESTMENT_FAIL:
      return { ...state, loadingUserMatchOddsInvestment: false, error: action.payload };

    // === Odds (General Update) ===
    case USER_UPDATE_ODDS_REQUEST:
      return { ...state, loadingUpdate: true, error: null };
    case USER_UPDATE_ODDS_SUCCESS:
      return { ...state, loadingUpdate: false };
    case USER_UPDATE_ODDS_FAIL:
      return { ...state, loadingUpdate: false, error: action.payload };

    // === Match Status Updates ===
    case UPDATE_MATCH_SELECTED_STATUS_REQUEST:
    case UPDATE_MATCH_ADMIN_STATUS_REQUEST:
      return { ...state, loadingUpdate: true, error: null };
    case UPDATE_MATCH_SELECTED_STATUS_SUCCESS:
    case UPDATE_MATCH_ADMIN_STATUS_SUCCESS:
      return { ...state, loadingUpdate: false };
    case UPDATE_MATCH_SELECTED_STATUS_FAIL:
    case UPDATE_MATCH_ADMIN_STATUS_FAIL:
      return { ...state, loadingUpdate: false, error: action.payload };

    // === Errors (reset only error) ===
    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};
