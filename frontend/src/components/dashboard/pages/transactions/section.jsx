import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllUserTransactions,
  updateTransactionStatus,
} from '../../../../actions/transactionAction';
import { Table, Dropdown, Spinner, Alert, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import './section.css';

const Section = () => {
  const dispatch = useDispatch();

  const { allTransactions = [], loading, error } = useSelector(
    (state) => state.transaction || {}
  );

  // Filters
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    dispatch(getAllUserTransactions());
  }, [dispatch]);

  // Real-time refresh after status change
  const handleStatusChange = async (transactionId, newStatus) => {
    if (newStatus === 'rejected') newStatus = 'failed';
    setUpdating(true);
    await dispatch(updateTransactionStatus(transactionId, newStatus));
    await dispatch(getAllUserTransactions());
    setUpdating(false);
  };

  // Flattening all transactions
  const flattenedTransactions = allTransactions.flatMap((userEntry) =>
    userEntry?.transactions?.length
      ? userEntry.transactions.map((tx) => ({
          ...tx,
          userEmail: userEntry.userId,
        }))
      : []
  );

  // Apply filters
  const filteredTransactions = flattenedTransactions.filter((tx) => {
    const statusMatch =
      transactionStatusFilter !== '' ? tx.status.toLowerCase() === transactionStatusFilter.toLowerCase() : true;
    const planMatch =
      planFilter !== '' ? tx.plan?.name?.toLowerCase().includes(planFilter.toLowerCase()) : true;
    const emailMatch =
      emailFilter !== '' ? tx.userEmail?.toLowerCase().includes(emailFilter.toLowerCase()) : true;
    return statusMatch && planMatch && emailMatch;
  });

  // Format date helper
  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    if (dateVal.$date) return new Date(dateVal.$date).toLocaleDateString();
    try {
      return new Date(dateVal).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <div className="admin-transaction-dashboard container mt-4">
      <Helmet>
        <title>Manage Transactions - Admin</title>
      </Helmet>

      <div className="dashboard-header d-flex justify-content-between align-items-center mb-3">
        <h2>📋 Manage Transactions</h2>
      </div>

      {(loading || updating) && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Section */}
      <div className="filter-section mb-4">
        <Form.Control
          type="text"
          placeholder="Search by Email"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          className="mb-2"
        />
        <Form.Control
          type="text"
          placeholder="Search by Plan Name"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="mb-2"
        />
        <Form.Control
          as="select"
          value={transactionStatusFilter}
          onChange={(e) => setTransactionStatusFilter(e.target.value)}
          className="mb-2"
        >
          <option value="">Filter by Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </Form.Control>
      </div>

      {!loading && !updating && filteredTransactions.length > 0 ? (
        <div className="table-responsive">
          <Table bordered hover className="text-center align-middle shadow-sm table-sm table-striped">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Transaction ID</th>
                <th>User Email</th>
                <th>Plan</th>
                <th>Price</th>
                <th>Coins</th>
                <th>Coin Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <tr key={tx.transactionId}>
                  <td>{index + 1}</td>
                  <td>{tx.transactionId}</td>
                  <td className="text-break">{tx.userEmail}</td>
                  <td>{tx.plan?.name || '-'}</td>
                  <td>{typeof tx.plan?.price === 'number' ? `$${tx.plan.price}` : '-'}</td>
                  <td>{tx.plan?.totalCoins ?? '-'}</td>
                  <td className="text-capitalize">{tx.plan?.coinType || '-'}</td>
                  <td>
                    <span
                      className={`badge rounded-pill px-3 py-2 ${
                        tx.status.toLowerCase() === 'pending'
                          ? 'bg-warning text-dark'
                          : tx.status.toLowerCase() === 'completed'
                          ? 'bg-success'
                          : 'bg-danger'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td>{formatDate(tx.transactionDate)}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="outline-primary" disabled={updating}>
                        Change
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() =>
                            handleStatusChange(tx.transactionId, 'completed')
                          }
                          disabled={updating}
                        >
                          ✅ Mark as Completed
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            handleStatusChange(tx.transactionId, 'rejected')
                          }
                          disabled={updating}
                        >
                          ❌ Mark as Rejected
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        !loading && !updating && <p className="text-center text-muted">No transactions found.</p>
      )}
    </div>
  );
};

export default Section;
