import axios from "axios";
import {
  GET_ALL_USERS_KEYS_AND_COINS_REQUEST,
  GET_ALL_USERS_KEYS_AND_COINS_SUCCESS,
  GET_ALL_USERS_KEYS_AND_COINS_FAIL,

  GET_USER_COINS_REQUEST,
  GET_USER_COINS_SUCCESS,
  GET_USER_COINS_FAIL,

  GET_USER_KEYS_REQUEST,
  GET_USER_KEYS_SUCCESS,
  GET_USER_KEYS_FAIL,

  REDEEM_COIN_FOR_ALL_MATCHES_REQUEST,
  REDEEM_COIN_FOR_ALL_MATCHES_SUCCESS,
  REDEEM_COIN_FOR_ALL_MATCHES_FAIL,

  REDEEM_COIN_FOR_EVENTS_REQUEST,
  REDEEM_COIN_FOR_EVENTS_SUCCESS,
  REDEEM_COIN_FOR_EVENTS_FAIL,

  REDEEM_SHARED_COIN_REQUEST,
  REDEEM_SHARED_COIN_SUCCESS,
  REDEEM_SHARED_COIN_FAIL,

  CHECK_COIN_EXPIRY_REQUEST,
  CHECK_COIN_EXPIRY_SUCCESS,
  CHECK_COIN_EXPIRY_FAIL,

  CLEAR_EXPIRED_COIN_REQUEST,
  CLEAR_EXPIRED_COIN_SUCCESS,
  CLEAR_EXPIRED_COIN_FAIL,
} from "../constants/coinConstants";

// API base URL from .env
const API_URL = process.env.REACT_APP_API_URL;

// Helper: Get token from localStorage
const getToken = () => localStorage.getItem("accessToken");

// Helper: Auth headers
const getAuthConfig = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

// Helper: Clean error message
const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "An error occurred";

// --- Actions ---

// ADMIN: Get all users' keys and coins
export const getAllUsersKeysAndCoins = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ALL_USERS_KEYS_AND_COINS_REQUEST });

    const { data } = await axios.get(`${API_URL}/keys-coins`, getAuthConfig());

    const now = new Date();

    // Mark recently redeemed coins
    const processedUsersData = data.usersData.map(user => {
      const updatedCoins = user.coins.map(coin => {
        const usedAtDate = coin.usedAt ? new Date(coin.usedAt) : null;
        return {
          ...coin,
          isRedeemedRecently:
            usedAtDate && (now.getTime() - usedAtDate.getTime() < 24 * 60 * 60 * 1000),
        };
      });
      return { ...user, coins: updatedCoins };
    });

    dispatch({
      type: GET_ALL_USERS_KEYS_AND_COINS_SUCCESS,
      payload: processedUsersData,
    });
  } catch (error) {
    dispatch({
      type: GET_ALL_USERS_KEYS_AND_COINS_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// USER: Get own coins
export const getUserCoins = () => async (dispatch) => {
  try {
    dispatch({ type: GET_USER_COINS_REQUEST });

    const { data } = await axios.get(`${API_URL}/coins`, getAuthConfig());

    dispatch({
      type: GET_USER_COINS_SUCCESS,
      payload: data.coins,
    });
  } catch (error) {
    dispatch({
      type: GET_USER_COINS_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// USER: Get own keys
export const getUserKeys = () => async (dispatch) => {
  try {
    dispatch({ type: GET_USER_KEYS_REQUEST });

    const { data } = await axios.get(`${API_URL}/coins/keys`, getAuthConfig());

    dispatch({
      type: GET_USER_KEYS_SUCCESS,
      payload: data.keys,
    });
  } catch (error) {
    dispatch({
      type: GET_USER_KEYS_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// USER: Redeem Coin for All Matches (event scope)
export const redeemCoinForAllMatches = (coinId, eventId) => async (dispatch) => {
  try {
    dispatch({ type: REDEEM_COIN_FOR_ALL_MATCHES_REQUEST });

    // API expects { coinId, eventId }
    const { data } = await axios.post(
      `${API_URL}/redeem/all`,
      { coinId, eventId },
      getAuthConfig()
    );

    dispatch({
      type: REDEEM_COIN_FOR_ALL_MATCHES_SUCCESS,
      payload: data.redeemedCoin,
    });
  } catch (error) {
    dispatch({
      type: REDEEM_COIN_FOR_ALL_MATCHES_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// USER: Redeem Coin for Multiple Events (if supported)
export const redeemCoinForEvents = (coinId, eventIds) => async (dispatch) => {
  try {
    dispatch({ type: REDEEM_COIN_FOR_EVENTS_REQUEST });

    // API expects { coinId, eventIds: [] }
    const { data } = await axios.post(
      `${API_URL}/redeem/events`,
      { coinId, eventIds },
      getAuthConfig()
    );

    dispatch({
      type: REDEEM_COIN_FOR_EVENTS_SUCCESS,
      payload: data.redeemedCoin,
    });
  } catch (error) {
    dispatch({
      type: REDEEM_COIN_FOR_EVENTS_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// USER: Redeem shared coin (match pass/code)
export const redeemSharedCoin = (shareableCode) => async (dispatch) => {
  try {
    dispatch({ type: REDEEM_SHARED_COIN_REQUEST });

    const { data } = await axios.post(
      `${API_URL}/coins/redeem/shared`,
      { shareableCode },
      getAuthConfig()
    );

    dispatch({
      type: REDEEM_SHARED_COIN_SUCCESS,
      payload: data.redeemedCoin,
    });
  } catch (error) {
    dispatch({
      type: REDEEM_SHARED_COIN_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// USER: Check coin expiry
export const checkCoinExpiry = () => async (dispatch) => {
  try {
    dispatch({ type: CHECK_COIN_EXPIRY_REQUEST });

    const { data } = await axios.post(
      `${API_URL}/coins/check/expiry`,
      {},
      getAuthConfig()
    );

    dispatch({
      type: CHECK_COIN_EXPIRY_SUCCESS,
      payload: data.remainingTime,
    });
  } catch (error) {
    dispatch({
      type: CHECK_COIN_EXPIRY_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// ADMIN/USER: Clear expired coins
export const clearExpiredCoin = () => async (dispatch) => {
  try {
    dispatch({ type: CLEAR_EXPIRED_COIN_REQUEST });

    const { data } = await axios.post(
      `${API_URL}/coins/clear/expired`,
      {},
      getAuthConfig()
    );

    dispatch({
      type: CLEAR_EXPIRED_COIN_SUCCESS,
      payload: data.message,
    });
  } catch (error) {
    dispatch({
      type: CLEAR_EXPIRED_COIN_FAIL,
      payload: getErrorMessage(error),
    });
  }
};
