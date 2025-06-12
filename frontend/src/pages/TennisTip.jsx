import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button, Modal } from 'react-bootstrap';
import socket from '../socket';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ViewTip.css';

import AppLayout from '../layout';
import Footer from '../components/Footer';
import TennisScoreboardCard from './sections/TennisScoreboardCard'; // Tennis scoreboard

import OpeningBalance from './sections/OpeningBalance';
import IframeBox from './sections/IframeBox';
import BalanceDisplay from './sections/BalanceDisplay';
import LiveTipsTable from './sections/LiveTipsTable';

import {
  getMatchById,
  getUserMatchOddsAndInvestment,
  userAddInvestment,
  getScoreboardByEventId,
} from '../actions/matchaction';
import { redeemCoinForAllMatches } from '../actions/coinAction';
import { loadUser } from '../actions/userAction';

const sportId = 4;

const TennisTip = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Get eventId from URL
  const query = new URLSearchParams(location.search);
  const eventId = query.get('eventId');

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentLoading, setInvestmentLoading] = useState(false);
  const [transactionError, setTransactionError] = useState('');
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinMessage, setCoinMessage] = useState('');
  const [redeemingCoin, setRedeemingCoin] = useState(false);

  // Time logic for expiry checks
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Redux State Selectors
  const {
    loading,
    userOddsAndInvestment,
    userLoading,
    scoreboard,
    match,
  } = useSelector((state) => state.match || {});
  const { user, loading: userLoadingState } = useSelector((state) => state.user || {});
  const isAdminOrSuperuser = user?.role === 'admin' || user?.role === 'superuser';



  // Fetch initial data
  const fetchInitialData = useCallback(() => {
    if (eventId) {
      dispatch(getMatchById(eventId, userOddsAndInvestment?.userId));
      dispatch(getUserMatchOddsAndInvestment(eventId));
      dispatch(getScoreboardByEventId(eventId));
    } else {
      navigate('/');
    }
  }, [dispatch, eventId, navigate, userOddsAndInvestment?.userId]);

  useEffect(() => {
    if (!user) dispatch(loadUser());
    fetchInitialData();
  }, [dispatch, user, fetchInitialData]);



  // --- Investment submit handler
  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    if (!investmentAmount) return;
    setTransactionError('');
    setInvestmentLoading(true);
    try {
      await dispatch(userAddInvestment(eventId, Number(investmentAmount)));
      await dispatch(getUserMatchOddsAndInvestment(eventId));
      setInvestmentAmount('');
    } catch (err) {
      setTransactionError('⚠️ Transaction failed: ' + (err.message || 'Please try again.'));
    } finally {
      setInvestmentLoading(false);
    }
  };

  // === COIN ACCESS LOGIC ===
  // Extract all user's coins from their keys
  const allCoins = user?.keys?.flatMap((key) => key.coin || []) || [];

  // Check for valid diamond coin (used + not expired)
  const diamondCoin = allCoins.find(
    (coin) =>
      (coin.type === 'diamond' || coin.coinType === 'diamond') &&
      coin.usedAt &&
      coin.expiresAt &&
      new Date(coin.expiresAt) > now
  );
  const hasDiamondAccess = !!diamondCoin; // this unlocks ALL events

  // Check for valid gold coin for *this* event
  const alreadyRedeemedGoldCoin = allCoins.find(
    (coin) =>
      (coin.type === 'gold' || !coin.type || coin.coinType === 'gold') &&
      coin.usedForEventId?.toString() === eventId &&
      coin.expiresAt &&
      new Date(coin.expiresAt) > now
  );

  // Only allow redeeming coins that are not yet used
  const unusedGoldCoins = allCoins.filter(
    (coin) =>
      (coin.type === 'gold' || !coin.type || coin.coinType === 'gold') &&
      !coin.usedAt
  );
  const unusedDiamondCoins = allCoins.filter(
    (coin) =>
      (coin.type === 'diamond' || coin.coinType === 'diamond') &&
      !coin.usedAt
  );
  // If diamond is already active, only allow redeeming diamond coins that aren't used. Block gold coin redemption.
  const unusedCoins = hasDiamondAccess ? unusedDiamondCoins : [...unusedDiamondCoins, ...unusedGoldCoins];

  // No coins, no gold for this event, no diamond for all events
  const hasNoCoins = unusedCoins.length === 0 && !alreadyRedeemedGoldCoin && !hasDiamondAccess;

  // Redeem prompt logic
  const canRedeemDiamond = unusedDiamondCoins.length > 0 && !hasDiamondAccess;
  const canRedeemGold = unusedGoldCoins.length > 0 && !alreadyRedeemedGoldCoin && !hasDiamondAccess;
  const canShowRedeemPrompt = canRedeemDiamond || canRedeemGold;

  // Opening balance prompt
  const openingBalanceMissing = !userOddsAndInvestment?.openingbalance;

  // --- Coin Redeem Modal Logic ---
  const handleRedeemClick = () => {
    setCoinMessage('');
    setShowCoinModal(true);
  };
  const handleSelectCoinToRedeem = async (coinId) => {
    setRedeemingCoin(true);
    setCoinMessage('');
    try {
      await dispatch(redeemCoinForAllMatches(coinId, eventId));
      setCoinMessage('Coin redeemed successfully! Access granted.');
      setShowCoinModal(false);
      await dispatch(loadUser());
      await dispatch(getUserMatchOddsAndInvestment(eventId));
    } catch (error) {
      let msg =
        (error && error.response && error.response.data && error.response.data.message) ||
        error.message ||
        typeof error === 'string'
          ? error
          : 'Failed to redeem coin. Please try again.';
      setCoinMessage(`Error: ${msg}`);
    } finally {
      setRedeemingCoin(false);
    }
  };

  // --- Loading Spinner ---
  if (loading || userLoading || userLoadingState) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // ==========================
  // ===== ADMIN / SUPERUSER UI
  // ==========================
  if (isAdminOrSuperuser) {
    return (
      <>
        <AppLayout />
        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-lg-8 col-md-8 col-sm-8 col-12">
              {/* Opening Balance Warning */}
              {openingBalanceMissing && (
                <Alert variant="warning" className="text-center">
                  <strong>⚠️ Please add your Opening Balance for accurate profit/loss tracking.</strong>
                </Alert>
              )}
              <div className="row">
                <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                  <OpeningBalance
                    investmentAmount={investmentAmount}
                    setInvestmentAmount={setInvestmentAmount}
                    investmentLoading={investmentLoading}
                    handleSubmit={handleInvestmentSubmit}
                  />
                </div>
                <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                  <BalanceDisplay amount={userOddsAndInvestment?.openingbalance} />
                </div>
                <div className='col-lg-12 col-md-12 col-12'>
                  <LiveTipsTable eventId={eventId} />
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4 col-12">
              <TennisScoreboardCard
                        eventId={eventId}
                        iframeLoaded={iframeLoaded}
                        setIframeLoaded={setIframeLoaded}
                        iframeError={iframeError}
                        setIframeError={setIframeError}
                      />
              <IframeBox
                eventId={eventId}
                iframeLoaded={iframeLoaded}
                setIframeLoaded={setIframeLoaded}
                iframeError={iframeError}
                setIframeError={setIframeError}
                sportId={sportId}
              />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ===================
  // ===== USER UI =====
  // ===================
  return (
    <>
      <AppLayout />
      <div className="container-fluid mt-5">
        <div className="row">
          {/* Alerts */}
          {!hasDiamondAccess && !alreadyRedeemedGoldCoin &&
            Array.isArray(user?.transactions) &&
            user.transactions.some((tx) => tx.status?.toLowerCase() === 'pending') && (
              <Alert variant="danger" className="text-center">
                <strong>⏳ Your transaction is under review.</strong><br />
                You will receive coins once it is verified by our team.
              </Alert>
            )}
          {transactionError && (
            <Alert variant="danger" className="text-center">
              {transactionError}
            </Alert>
          )}
          {!hasDiamondAccess && !alreadyRedeemedGoldCoin && hasNoCoins && (
            <Alert variant="warning" className="text-center">
              <strong>⚠️ No Coins Available!</strong><br />
              Please wait if you have made a transaction.<br />
              If not, please purchase coins to continue.
              <div className="mt-3">
                <Button variant="primary" onClick={() => navigate('/payment')}>
                  Buy Coins
                </Button>
              </div>
            </Alert>
          )}
          {canShowRedeemPrompt && (
            <>
              <Alert variant="info" className="text-center">
                <strong>
                  {'You have coins!'}<br />
                  Please redeem your coin to activate access.
                </strong>
              </Alert>
              <div className="mt-3 pb-3 center">
                <Button
                  variant="primary"
                  onClick={handleRedeemClick}
                  disabled={unusedCoins.length === 0}
                >
                  Redeem Coin
                </Button>
              </div>
              {coinMessage && (
                <div
                  className="mt-2 text-center"
                  style={{ color: coinMessage.startsWith('Error') ? 'red' : 'green' }}
                >
                  {coinMessage}
                </div>
              )}
            </>
          )}
          {openingBalanceMissing && (
            <Alert variant="warning" className="text-center">
              <strong>⚠️ Please add your Opening Balance to proceed.</strong>
            </Alert>
          )}
          <div className="col-lg-8 col-md-8 col-sm-8 col-12">
            {/* Coin selection Modal */}
            <Modal show={showCoinModal} onHide={() => setShowCoinModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Select a Coin to Redeem</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {unusedCoins.length === 0 ? (
                  <p>No unused coins available.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {unusedCoins.map((coin) => {
                      // Block gold coin selection if diamond access is active!
                      if (hasDiamondAccess && (coin.type === 'gold' || !coin.type || coin.coinType === 'gold')) {
                        return null;
                      }
                      return (
                        <li key={coin.id || coin._id} style={{ marginBottom: 12 }}>
                          <Button
                            variant={coin.type === 'diamond' || coin.coinType === 'diamond' ? 'info' : 'success'}
                            block="true"
                            disabled={redeemingCoin}
                            onClick={() => handleSelectCoinToRedeem(coin.id || coin._id)}
                          >
                            {coin.type === 'diamond' || coin.coinType === 'diamond' ? '💎 ' : ''}
                            {coin.shareableCode || coin.id || coin._id}
                            {coin.type === 'diamond' || coin.coinType === 'diamond' ? ' (Diamond)' : ''}
                            {coin.type === 'gold' || coin.coinType === 'gold' ? ' (Gold)' : ''}
                            {coin.expiresAt && (
                              <span style={{ fontSize: '0.85em', color: '#555', marginLeft: 8 }}>
                                {'Expires: '}
                                {new Date(coin.expiresAt).toLocaleString()}
                              </span>
                            )}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {coinMessage && (
                  <div
                    className="mt-2 text-center"
                    style={{ color: coinMessage.startsWith('Error') ? 'red' : 'green' }}
                  >
                    {coinMessage}
                  </div>
                )}
              </Modal.Body>
            </Modal>
            {/* Scoreboard & Market/Tips */}
            <div className="row">
              <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                <OpeningBalance
                  investmentAmount={investmentAmount}
                  setInvestmentAmount={setInvestmentAmount}
                  investmentLoading={investmentLoading}
                  handleSubmit={handleInvestmentSubmit}
                />
              </div>
              <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                <BalanceDisplay amount={userOddsAndInvestment?.openingbalance} />
              </div>
              {/* Show LiveTipsTable if gold coin is redeemed for this event OR diamond is active (all events) */}
              {(alreadyRedeemedGoldCoin || hasDiamondAccess) && (
                <div className='col-lg-12 col-md-12 col-12'>
                  <LiveTipsTable eventId={eventId} />
                </div>
              )}
            </div>
          </div>
          {/* Sidebar Column */}
          <div className="col-lg-4 col-md-4 col-sm-4 col-12">
           <TennisScoreboardCard
                        eventId={eventId}
                        iframeLoaded={iframeLoaded}
                        setIframeLoaded={setIframeLoaded}
                        iframeError={iframeError}
                        setIframeError={setIframeError}
                      />
            <IframeBox
              eventId={eventId}
              iframeLoaded={iframeLoaded}
              setIframeLoaded={setIframeLoaded}
              iframeError={iframeError}
              setIframeError={setIframeError}
              sportId={sportId}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TennisTip;
