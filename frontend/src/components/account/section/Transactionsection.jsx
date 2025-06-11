import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createTransaction } from '../../../actions/transactionAction';
import { loadUser } from '../../../actions/userAction'; // ✅ Load user after transaction
import styles from './TransactionPage.module.css';

const Transactionsection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { plan } = location.state || {};
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  if (!plan) return <p className="text-center text-danger">No plan selected.</p>;

  const getQrCodeUrl = (price) => {
    switch (price) {
      case 10: return '/assets/10.jpg';
      case 100: return '/assets/100.jpg';
      case 900: return '/assets/900.jpg';
      case 2500: return '/assets/2500.jpg';
      case 4000: return '/assets/4000.jpg';
      default: return '/assets/default.jpg';
    }
  };

  const handleTransactionSubmit = async () => {
    if (!transactionId.trim()) {
      alert('Please enter a valid Transaction ID');
      return;
    }

    setLoading(true);

    const transactionData = {
      transactionId,
      planId: plan._id,
      price: plan.price,
      name: plan.name,
      validity: plan.validity,
    };

    try {
      await dispatch(createTransaction(transactionData));

      setConfirmationMessage('Transaction is being processed. You will be redirected shortly...');

      setTimeout(async () => {
        await dispatch(loadUser());
        navigate('/', { replace: true });
      }, 2000);

    } catch (error) {
      setConfirmationMessage('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Complete Your Payment</h2>
        <p><strong>Plan:</strong> {plan.name}</p>
        <p><strong>Price:</strong> {plan.price} USDT</p>
        <p><strong>Access:</strong> {plan.description}</p>
        <p><strong>Coin Type:</strong> <span className="text-capitalize">{plan.coinType}</span></p>
        <p><strong>Total Coins:</strong> {plan.totalCoins}</p>
        {plan.validity && <p><strong>Validity:</strong> {plan.validity}</p>}

        <div className={styles.qrContainer}>
          <img src={getQrCodeUrl(plan.price)} alt="QR Code" className={styles.qrImage} />
        </div>

        <input
          type="text"
          className={styles.input}
          placeholder="Enter Wallet/Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          disabled={loading}
        />

        <button
          className={styles.button}
          onClick={handleTransactionSubmit}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Submit Transaction ID'}
        </button>

        {loading && <p className={styles.loadingText}>Processing your transaction...</p>}

        {confirmationMessage && (
          <p className={styles.confirmationMessage}>{confirmationMessage}</p>
        )}
      </div>
    </div>
  );
};

export default Transactionsection;
