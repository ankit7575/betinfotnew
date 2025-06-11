import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllPlans, selectPlan } from '../../../actions/planAction';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Plans.css';
import { useNavigate } from 'react-router-dom';

const Plans = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Plan filter state: 'all', 'gold', 'diamond'
  const [filter, setFilter] = useState('all');

  // Access plans from Redux store
  const { plans, loading, error } = useSelector((state) => state.planList || {});

  useEffect(() => {
    dispatch(getAllPlans());
  }, [dispatch]);

  const handlePay = (plan) => {
    dispatch(selectPlan({ planId: plan._id }));
    navigate('/transaction', { state: { plan } });
  };

  // Filter logic
  const getFilteredPlans = () => {
    if (!plans) return [];
    if (filter === 'all') return plans;
    return plans.filter((plan) => plan.coinType === filter);
  };
  const filteredPlans = getFilteredPlans();

  if (loading) return <div className="text-center py-4">Loading plans...</div>;
  if (error) return <div className="alert alert-danger text-center">Error: {error}</div>;
  if (!plans || plans.length === 0)
    return <div className="alert alert-warning text-center">No plans available.</div>;

  return (
    <div className="container mt-5">
      <div className="mb-4 text-center">
        <button
          className={`btn btn-warning mx-2 ${filter === 'gold' ? 'active' : ''}`}
          onClick={() => setFilter('gold')}
        >
          Show Gold Plans
        </button>
        <button
          className={`btn btn-info mx-2 ${filter === 'diamond' ? 'active' : ''}`}
          onClick={() => setFilter('diamond')}
        >
          Show Diamond Plans
        </button>
        <button
          className={`btn btn-secondary mx-2 ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Show All
        </button>
      </div>
      <div className="row justify-content-center">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <div key={plan._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
              <div className="card plan-card shadow-lg h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                  <h3 className="card-title text-center mb-3">{plan.price} USDT</h3>
                  <h5 className="plan-name text-center mb-2">{plan.name}</h5>
                  <p>
                    <strong>Description:</strong>
                    <br />
                    <span>{plan.description}</span>
                  </p>
                  <p>
                    <strong>Coin Type:</strong>{' '}
                    <span className="text-capitalize">{plan.coinType}</span>
                  </p>
                  <p>
                    <strong>Total Coins:</strong> {plan.totalCoins}
                  </p>
                  <button className="btn btn-custom mt-auto w-100" onClick={() => handlePay(plan)}>
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="alert alert-warning text-center w-100">
            No plans available for this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default Plans;
