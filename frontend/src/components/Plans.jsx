import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllPlans, selectPlan } from '../actions/planAction';
import 'bootstrap/dist/css/bootstrap.min.css';
import './paymentsLab.css';
import { useNavigate } from 'react-router-dom';

const Plans = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local filter state: 'all', 'gold', or 'diamond'
  const [filter, setFilter] = useState('all');

  // Access plans from Redux store
  const { plans, loading, error } = useSelector((state) => state.planList || {});

  // Fetch all plans when the component mounts
  useEffect(() => {
    dispatch(getAllPlans());
  }, [dispatch]);

  const handlePay = (plan) => {
    dispatch(selectPlan({ planId: plan._id }));
    navigate('/transaction', { state: { plan } });
  };

  // Filter plans based on selected filter
  const getFilteredPlans = () => {
    if (!plans) return [];
    if (filter === 'all') return plans;
    return plans.filter((plan) => plan.coinType === filter);
  };

  const filteredPlans = getFilteredPlans();

  // Loading, error or no plans available handling
  if (loading) return <div className="text-center py-4">Loading plans...</div>;
  if (error) return <div className="alert alert-danger text-center">Error: {error}</div>;
  if (!plans || plans.length === 0)
    return <div className="alert alert-warning text-center">No plans available.</div>;

  return (
    <div className="container-fluid planbox py-5">
      <div className='row' >
        <div className='col-lg-11 mx-auto' >
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
        </div>
<div className='col-lg-11 mx-auto' >
  <div className="planWrapper d-flex flex-wrap justify-content-center">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <div key={plan._id} className="loginBox m-3 p-4 shadow bg-white rounded">
              <h3 className="card-title text-center mb-2">{plan.price} USDT</h3>
              <p className="plan-name text-center fw-bold mb-1">{plan.name}</p>
              <p className="text-center mb-1"><strong>Description:</strong> {plan.description}</p>
              <p className="text-center mb-1"><strong>Coin Type:</strong> <span className="text-capitalize">{plan.coinType}</span></p>
              <p className="text-center mb-3"><strong>Total Coins:</strong> {plan.totalCoins}</p>
              <button className="button w-100" onClick={() => handlePay(plan)}>
                Pay Now
              </button>
            </div>
          ))
        ) : (
          <div className="alert alert-warning text-center w-100">No plans available for this filter.</div>
        )}
      </div>
</div>
      </div>
   
    
    </div>
  );
};

export default Plans;
