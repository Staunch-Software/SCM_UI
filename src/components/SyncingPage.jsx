// src/components/SyncingPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiclient';
import '../styles/OnboardingPage.css'; // Reuse styles

const SyncingPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('syncing');
  const [error, setError] = useState('');

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await apiClient.get('/api/onboarding/sync-status');
        const currentStatus = response.data.status;
        setStatus(currentStatus);

        if (currentStatus === 'completed') {
          // Success! Navigate to the dashboard.
          navigate('/dashboard', { replace: true });
        } else if (currentStatus === 'failed') {
          setError('Data synchronization failed. Please contact support.');
        }
      } catch (err) {
        setError('Could not retrieve sync status. Please refresh the page.');
      }
    };

    // Poll every 5 seconds
    const intervalId = setInterval(pollStatus, 5000);

    // Initial check
    pollStatus();

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h1>Preparing Your Workspace</h1>
        <p>We're syncing data from your ERP. This may take several minutes.</p>
        
        <div style={{ margin: '2rem 0' }}>
          {/* A simple spinner */}
          <div className="spinner"></div>
        </div>

        <p style={{ color: '#64748b' }}>Please keep this page open. You will be redirected automatically when the sync is complete.</p>
        
        {error && <p className="onboarding-error" style={{ marginTop: '1rem' }}>{error}</p>}
      </div>
      <style>{`
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #2563eb;
          margin: 0 auto;
          animation: spin 1s ease infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncingPage;