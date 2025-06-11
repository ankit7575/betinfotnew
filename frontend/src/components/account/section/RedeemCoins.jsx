import React, { useState } from 'react';
import './RedeemCoins.css';

const RedeemCoins = ({ coins = [], onRedeem }) => {
  const [selectedCoinId, setSelectedCoinId] = useState('');

  const handleRedeem = () => {
    if (selectedCoinId) {
      onRedeem(selectedCoinId);
    } else {
      alert('Please select a coin to redeem.');
    }
  };

  return (
    <div className="redeem-coins-section">
      <h2>Redeem Your Coin</h2>
      <div className="select-coin-container mb-3">
        <label htmlFor="coin-select" className="mb-2">Select Coin:</label>
        <select
          id="coin-select"
          value={selectedCoinId}
          onChange={(e) => setSelectedCoinId(e.target.value)}
          disabled={coins.length === 0}
        >
          <option value="">-- Select a Coin --</option>
          {coins.length > 0 ? (
            coins.map((coin) => {
              // Date handling
              let expiresString = '';
              if (coin.expiresAt) {
                let expDate =
                  typeof coin.expiresAt === 'string'
                    ? new Date(coin.expiresAt)
                    : coin.expiresAt.$date
                    ? new Date(coin.expiresAt.$date)
                    : null;
                if (expDate) {
                  expiresString = ` - Expires: ${expDate.toLocaleString()}`;
                }
              }
              return (
                <option key={coin.id} value={coin.id}>
                  [{coin.type ? coin.type.charAt(0).toUpperCase() + coin.type.slice(1) : 'Coin'}] {coin.shareableCode}
                  {expiresString}
                </option>
              );
            })
          ) : (
            <option disabled>No coins available</option>
          )}
        </select>
      </div>

      <button
        className="redeem-button"
        onClick={handleRedeem}
        disabled={coins.length === 0}
      >
        Redeem Coin
      </button>
    </div>
  );
};

export default RedeemCoins;
