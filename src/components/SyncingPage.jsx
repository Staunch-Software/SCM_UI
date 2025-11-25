// src/components/SyncingPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiclient';
import '../styles/SyncingPage.css';

const SyncingPage = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [jobStatus, setJobStatus] = useState('INITIALIZING');
  const [details, setDetails] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const pollProgress = async () => {
      try {
        const response = await apiClient.get('/api/sync/progress');
        const data = response.data;

        setJobStatus(data.status || 'INITIALIZING');
        setDetails(data.details || {});

        if (data.details) {
          const models = Object.values(data.details);
          if (models.length > 0) {
            const total = models.reduce((acc, curr) => acc + (curr.percent || 0), 0);
            setOverallProgress(Math.round(total / models.length));
          }
        }

        // --- FIX: Redirect Logic ---
        if (data.status === 'COMPLETED') {
           // 1. Update Local Storage immediately
           completeOnboarding();
           
           // 2. Force Hard Redirect
           // Using window.location.href instead of navigate() ensures a full page reload.
           // This forces AuthContext to re-read the 'completed' status from LocalStorage,
           // bypassing any stale state in the React Router guards.
           console.log("Sync Complete. Redirecting...");
           setTimeout(() => {
               window.location.href = '/dashboard'; 
           }, 500);
        }
      } catch (err) {
        console.error("Sync poll failed", err);
      }
    };

    const intervalId = setInterval(pollProgress, 2000);
    pollProgress();

    return () => clearInterval(intervalId);
  }, [navigate, completeOnboarding]);

  return (
    <div className="sync-container">
      <div className="sync-card">
        <div className="sync-header">
          <h1>Preparing Your Workspace</h1>
          <p>We are syncing your ERP data in distributed batches.</p>
        </div>

        <div className="progress-section">
          <div className="progress-label">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        <div className="details-grid">
          {Object.entries(details).map(([name, stats]) => (
            <div key={name} className="detail-item">
              <div className="detail-header">
                <span className="model-name">{name}</span>
                <span className="model-counts">{stats.counts}</span>
              </div>
              <div className="mini-progress-track">
                <div className="mini-progress-fill" style={{ width: `${stats.percent}%` }}></div>
              </div>
            </div>
          ))}
          {Object.keys(details).length === 0 && <p className="waiting-message">Initializing workers...</p>}
        </div>
      </div>
    </div>
  );
};

export default SyncingPage;