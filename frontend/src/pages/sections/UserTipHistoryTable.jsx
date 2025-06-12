import React, { useEffect, useState, useCallback } from 'react';
import { Table } from 'react-bootstrap';
import './TipHistoryTable.css';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const UserTipHistoryTable = ({
  userOwnOdds = [],
}) => {
  const [flatRows, setFlatRows] = useState([]);

  const flattenHistory = useCallback((userOdds) => {
    const flat = [];
  
    userOdds?.forEach((tip) => {
      const { runnerName = '-', layingHistory = [] } = tip;
      layingHistory.forEach((entry) => {
        flat.push({
          datetime: formatTime(entry.timestamp),
          runnerName,
          side: entry.odds.lay ? "Lay" : "Back",
          rate: entry.odds.lay ? entry.odds.lay : entry.odds.back,
          amount: entry.Ammount.lay ? entry.Ammount.lay : entry.Ammount.back,
          timestamp: entry.timestamp,
        });
      });
    });
    // Sort by timestamp DESC
    return flat.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, []);

  useEffect(() => {
    const updated = flattenHistory(userOwnOdds?.runners);
    setFlatRows(updated);
  }, [userOwnOdds, flattenHistory]);

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h2 className="fw-bold">User Tips History</h2>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <Table bordered hover responsive className="table-striped align-middle shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>S. No.</th>
                <th>Date &amp; Time</th>
                <th>Runner</th>
                <th>Side</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {flatRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No Tips history available.</td>
                </tr>
              ) : (
                flatRows.map((row, idx) => (
                  <tr key={row.serial + '-' + row.timestamp + '-' + row.side}>
                    <td>{idx + 1}</td>
                    <td>{row.datetime}</td>
                    <td>{row.runnerName}</td>
                    <td>{row.side}</td>
                    <td>{row.rate}</td>
                    <td>{row.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default UserTipHistoryTable;
