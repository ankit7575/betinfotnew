import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
} from "../../../../actions/userAction";
import { Button, Table, Spinner, Form } from "react-bootstrap";
import { Helmet } from "react-helmet";
import './section.css';

// These must match your backend's allowed roles
const ROLE_OPTIONS = ["user", "admin", "superuser"];

const Section = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error, updatingRole, updateRoleError } = useSelector(
    (state) => state.allUsers // adjust if needed
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [keyFilter, setKeyFilter] = useState('');
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await dispatch(deleteUser(userId));
      dispatch(getAllUsers());
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setRoleUpdatingId(userId);
    await dispatch(updateUserRole(userId, { role: newRole }));
    setRoleUpdatingId(null);
    dispatch(getAllUsers());
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setPhoneFilter('');
    setKeyFilter('');
  };

  const filteredUsers = users.filter((user) => {
    const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter ? user.role?.toLowerCase() === roleFilter.toLowerCase() : true;
    const phoneMatch = phoneFilter ? user.phoneNumber?.toString().includes(phoneFilter) : true;
    const keyMatch = keyFilter ? user.keysAvailable?.toString().includes(keyFilter) : true;
    return emailMatch && roleMatch && phoneMatch && keyMatch;
  });

  return (
    <div className="admin-user-container">
      <Helmet>
        <title>Manage Users - Admin</title>
      </Helmet>

      <h1 className="mb-4">Manage Users</h1>

      <div className="filter-section d-flex flex-wrap gap-2 mb-4 align-items-center">
        <Form.Control
          type="text"
          placeholder="Search by email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: 170 }}
        />
        <Form.Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ minWidth: 160 }}
        >
          <option value="">Filter by Role</option>
          {ROLE_OPTIONS.map(role => <option key={role}>{role}</option>)}
        </Form.Select>
        <Form.Control
          type="text"
          placeholder="Search by phone"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          style={{ minWidth: 150 }}
        />
        <Form.Control
          type="text"
          placeholder="Search by keys"
          value={keyFilter}
          onChange={(e) => setKeyFilter(e.target.value)}
          style={{ minWidth: 120 }}
        />
        <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
      </div>

      {loading && <div className="my-4 text-center"><Spinner animation="border" /></div>}
      {error && <div className="text-danger mb-3">{error}</div>}
      {updateRoleError && <div className="text-danger mb-3">{updateRoleError}</div>}

      {!loading && !error && (
        <div className="table-responsive">
          <Table striped bordered hover responsive size="sm" className="align-middle shadow">
            <thead className="table-dark">
              <tr>
                <th>User ID</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Keys Available</th>
                <th>Role</th>
                <th style={{ minWidth: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td style={{ maxWidth: 90, fontSize: "12px" }}>{user._id}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber || <span className="text-muted">-</span>}</td>
                    <td>{user.keysAvailable ?? <span className="text-muted">-</span>}</td>
                    <td>
                      <Form.Select
                        value={user.role}
                        disabled={roleUpdatingId === user._id}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{ minWidth: 110 }}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </Form.Select>
                      {roleUpdatingId === user._id && (
                        <Spinner size="sm" animation="border" className="ms-2" />
                      )}
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(user._id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted">No users found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Section;
