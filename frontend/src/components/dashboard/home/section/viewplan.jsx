import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllPlans,
  addPlan,
  editPlan,
  deletePlan,
} from '../../../../actions/planAction';
import './ViewPlan.css';
import { Modal, Button, Form } from 'react-bootstrap';

const COIN_TYPES = [
  { value: 'gold', label: 'Gold (Single match)' },
  { value: 'diamond', label: 'Diamond (All matches)' },
];

const AdminPlanDashboard = () => {
  const dispatch = useDispatch();
  const { plans, loading, error } = useSelector((state) => state.planList || {});

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    coinType: 'gold', // default
    totalCoins: '',
  });

  // Load plans on component mount
  useEffect(() => {
    dispatch(getAllPlans());
  }, [dispatch]);

  const openAddModal = () => {
    setForm({ name: '', description: '', price: '', coinType: 'gold', totalCoins: '' });
    setIsEditMode(false);
    setCurrentPlanId(null);
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      coinType: plan.coinType || 'gold',
      totalCoins: plan.totalCoins,
    });
    setCurrentPlanId(plan._id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      await dispatch(deletePlan(id));
      dispatch(getAllPlans());
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const planData = {
      ...form,
      price: Number(form.price),
      totalCoins: Number(form.totalCoins),
    };
    if (isEditMode) {
      await dispatch(editPlan(currentPlanId, planData));
    } else {
      await dispatch(addPlan(planData));
    }
    setShowModal(false);
    setCurrentPlanId(null);
    dispatch(getAllPlans());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="admin-plan-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Manage Subscription Plans</h2>
        <Button variant="success" onClick={openAddModal}>Add Plan</Button>
      </div>

      {loading && <div>Loading plans...</div>}
      {error && <div className="text-danger">Error: {error}</div>}

      {!loading && plans && plans.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="d-none d-md-block table-responsive">
            <table className="table table-bordered table-striped text-center">
              <thead className="thead-dark">
                <tr>
                  <th>#</th>
                  <th>Plan Name</th>
                  <th>Description</th>
                  <th>Price ($)</th>
                  <th>Coin Type</th>
                  <th>Total Coins</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => (
                  <tr key={plan._id}>
                    <td>{index + 1}</td>
                    <td>{plan.name}</td>
                    <td>{plan.description}</td>
                    <td>{plan.price}</td>
                    <td className="text-capitalize">{plan.coinType}</td>
                    <td>{plan.totalCoins}</td>
                    <td>
                      <Button variant="primary" size="sm" className="me-2" onClick={() => openEditModal(plan)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(plan._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="d-md-none">
            {plans.map((plan) => (
              <div className="card mb-3 shadow-sm" key={plan._id}>
                <div className="card-body">
                  <h5 className="card-title">{plan.name}</h5>
                  <p className="card-text">{plan.description}</p>
                  <p className="card-text">
                    <strong>Price:</strong> {plan.price}<br />
                    <strong>Coin Type:</strong> <span className="text-capitalize">{plan.coinType}</span><br />
                    <strong>Total Coins:</strong> {plan.totalCoins}
                  </p>
                  <div className="d-flex justify-content-between">
                    <Button variant="primary" size="sm" onClick={() => openEditModal(plan)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(plan._id)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        !loading && <div>No plans available.</div>
      )}

      {/* Modal for Add/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditMode ? 'Edit Plan' : 'Add Plan'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Plan Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={form.description}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price ($)</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                min={0}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Coin Type</Form.Label>
              <Form.Select
                name="coinType"
                value={form.coinType}
                onChange={handleChange}
                required
              >
                {COIN_TYPES.map((opt) => (
                  <option value={opt.value} key={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Total Coins</Form.Label>
              <Form.Control
                type="number"
                name="totalCoins"
                value={form.totalCoins}
                onChange={handleChange}
                required
                min={1}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              {isEditMode ? 'Update Plan' : 'Add Plan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPlanDashboard;
