import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllUserTransactions,
  updateTransactionStatus,
} from '../../../../actions/transactionAction';
import { Table, Dropdown, Spinner, Alert, Form, Card, Row, Col, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import './AdminTransactionDashboard.css';

const AdminTransactionDashboard = () => {
  const dispatch = useDispatch();

  // Try both keys for compatibility
  const transactionData = useSelector((state) => state.transaction || {});
  const userTransactions = transactionData.userTransactions || transactionData.allTransactions || [];
  const loading = transactionData.loading;
  const error = transactionData.error;

  // Filters
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    dispatch(getAllUserTransactions());
  }, [dispatch]);

  // Flatten all user transactions into one array
  const flattenedTransactions = useMemo(
    () =>
      (userTransactions || []).flatMap((userEntry) =>
        Array.isArray(userEntry.transactions)
          ? userEntry.transactions.map((tx) => ({
              ...tx,
              userEmail: userEntry.userId,
            }))
          : []
      ),
    [userTransactions]
  );

  // Sort by transaction date (latest first)
  const sortedTransactions = useMemo(() => {
    return [...flattenedTransactions].sort((a, b) => {
      const aTime = a.transactionDate?.$date
        ? new Date(a.transactionDate.$date).getTime()
        : new Date(a.transactionDate || 0).getTime();
      const bTime = b.transactionDate?.$date
        ? new Date(b.transactionDate.$date).getTime()
        : new Date(b.transactionDate || 0).getTime();
      return bTime - aTime;
    });
  }, [flattenedTransactions]);

  // 7 Latest Transactions
  const latest7 = sortedTransactions.slice(0, 7);

  

  // Format date helper
  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    if (dateVal.$date) return new Date(dateVal.$date).toLocaleString();
    try {
      return new Date(dateVal).toLocaleString();
    } catch {
      return '-';
    }
  };

  return (
    <div className="admin-transaction-dashboard container-xxl py-4">
      <Helmet>
        <title>Manage Transactions - Admin</title>
      </Helmet>

      <div className="dashboard-header d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">
          <span className="gradient-text">📋 Manage Transactions</span>
        </h2>
      </div>

      {(loading || updating) && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Pending Summary and Latest Tips */}
      <Row className="mb-4 g-4">
       
        <Col md={12} sm={12}>
          <Card className="shadow-sm latest-card h-100">
            <Card.Body>
              <h5 className="fw-semibold mb-3">Latest 7 Transactions</h5>
              <div className="latest-7-table-wrap">
                <Table borderless size="sm" className="mb-0 latest-7-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Coins</th>
                      <th>Price</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest7.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-muted text-center">
                          No transactions
                        </td>
                      </tr>
                    ) : (
                      latest7.map((tx, idx) => (
                        <tr key={tx.transactionId}>
                          <td className="fw-semibold">{idx + 1}</td>
                          <td className="text-break" style={{ maxWidth: 150 }}>{tx.userEmail}</td>
                          <td>{tx.plan?.name || '-'}</td>
                          <td>
                            <span
                              className={`badge rounded-pill px-2 py-1 fs-6 ${
                                tx.status?.toLowerCase() === 'pending'
                                  ? 'bg-warning text-dark'
                                  : tx.status?.toLowerCase() === 'completed'
                                  ? 'bg-success'
                                  : 'bg-danger'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td>{tx.plan?.totalCoins ?? '-'}</td>
                          <td>{typeof tx.plan?.price === 'number' ? `$${tx.plan.price}` : '-'}</td>
                          <td>{formatDate(tx.transactionDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Section */}
      {/* ... your filter and main table section as before ... */}
    </div>
  );
};

export default AdminTransactionDashboard;
