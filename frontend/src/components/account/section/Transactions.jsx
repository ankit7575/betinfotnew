import React from 'react';
import './Transactions.css';

const Transactions = ({ user }) => {
  if (!user || !Array.isArray(user.transactions) || user.transactions.length === 0) {
    return <p className="text-center mt-4">No transactions available.</p>;
  }

  return (
    <div className="transactions-container">
      <h2 className="mb-4">Wallet</h2>
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Wallet ID</th>
            <th>User ID</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Transaction Date</th>
          </tr>
        </thead>
        <tbody>
          {user.transactions.map((transaction) => {
            // Handle both string/object for plan field
            let planLabel = 'N/A';
            if (transaction.plan) {
              if (typeof transaction.plan === 'object') {
                planLabel = transaction.plan.name || transaction.plan._id || transaction.plan.$oid || 'N/A';
              } else {
                planLabel = transaction.plan;
              }
            }

            // Transaction date handling (MongoDB format or ISO string)
            let txnDate = '-';
            if (transaction.transactionDate) {
              if (transaction.transactionDate.$date) {
                txnDate = new Date(transaction.transactionDate.$date).toLocaleString();
              } else {
                txnDate = new Date(transaction.transactionDate).toLocaleString();
              }
            }

            return (
              <tr key={transaction._id?.$oid || transaction.transactionId}>
                <td data-label="Wallet ID">{transaction.transactionId || '-'}</td>
                <td data-label="User ID">{transaction.userId || '-'}</td>
                <td data-label="Plan">{planLabel}</td>
                <td data-label="Status">{transaction.status || '-'}</td>
                <td data-label="Transaction Date">{txnDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Transactions;
