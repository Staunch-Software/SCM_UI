// src/components/MonitoringDashboard.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiclient';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Server,
  Database,
  Zap,
  RefreshCw,
  XCircle
} from 'lucide-react';
import '../styles/MonitoringDashboard.css';

const MonitoringDashboard = () => {
  // State Management
  const [queueDepth, setQueueDepth] = useState(null);
  const [erpCallRate, setErpCallRate] = useState([]);
  const [failedBatches, setFailedBatches] = useState([]);
  const [workerHealth, setWorkerHealth] = useState([]);
  const [tenantThroughput, setTenantThroughput] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all monitoring data
  useEffect(() => {
    fetchMonitoringData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 5000); // Refresh every 5s
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchMonitoringData = async () => {
    try {
      setError(null);
      
      const [queueRes, callRateRes, failedRes, workerRes, throughputRes] = await Promise.all([
        apiClient.get('/api/monitoring/queue-depth').catch(err => ({ data: null, error: err })),
        apiClient.get('/api/monitoring/erp-call-rate').catch(err => ({ data: null, error: err })),
        apiClient.get('/api/monitoring/failed-batches').catch(err => ({ data: null, error: err })),
        apiClient.get('/api/monitoring/worker-health').catch(err => ({ data: null, error: err })),
        apiClient.get('/api/monitoring/tenant-throughput').catch(err => ({ data: null, error: err }))
      ]);

      // Handle responses gracefully
      if (queueRes.data) setQueueDepth(queueRes.data);
      if (callRateRes.data) setErpCallRate(callRateRes.data.data_points?.slice(-20) || []); // Last 20 minutes
      if (failedRes.data) setFailedBatches(failedRes.data.batches?.slice(0, 10) || []); // Top 10
      if (workerRes.data) setWorkerHealth(workerRes.data.workers || []);
      if (throughputRes.data) setTenantThroughput(throughputRes.data.tenants || []);
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Monitoring fetch error:', err);
      setError('Failed to fetch monitoring data. Please check if the backend is running.');
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setLoading(true);
    fetchMonitoringData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Loading State
  if (loading && !queueDepth) {
    return (
      <div className="monitoring-dashboard">
        <div className="loading-spinner">
          <RefreshCw size={48} className="spin-animation" />
          <p>Loading Monitoring Data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !queueDepth) {
    return (
      <div className="monitoring-dashboard">
        <div className="error-state">
          <XCircle size={48} color="#ef4444" />
          <h2>Monitoring Unavailable</h2>
          <p>{error}</p>
          <button onClick={handleManualRefresh} className="retry-button">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      {/* Header with Controls */}
      <div className="dashboard-header">
        <div>
          <h1><Activity size={32} /> ETL System Monitoring</h1>
          <p className="dashboard-subtitle">Real-time performance metrics and health status</p>
        </div>
        <div className="header-controls">
          <button 
            onClick={toggleAutoRefresh} 
            className={`toggle-button ${autoRefresh ? 'active' : ''}`}
          >
            <Zap size={16} />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
          <button onClick={handleManualRefresh} className="refresh-button" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Queue Depth Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="High Priority Queue"
          value={queueDepth?.celery_queues?.high_priority?.active || 0}
          subtitle={`${queueDepth?.celery_queues?.high_priority?.reserved || 0} reserved`}
          icon={<Activity />}
          color="blue"
          trend={queueDepth?.celery_queues?.high_priority?.active > 50 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Bulk Data Queue"
          value={queueDepth?.celery_queues?.bulk_data?.active || 0}
          subtitle={`${queueDepth?.celery_queues?.bulk_data?.reserved || 0} reserved`}
          icon={<Database />}
          color="green"
          trend={queueDepth?.celery_queues?.bulk_data?.active > 100 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Embeddings Queue"
          value={queueDepth?.celery_queues?.embeddings?.active || 0}
          subtitle={`${queueDepth?.celery_queues?.embeddings?.reserved || 0} reserved`}
          icon={<Zap />}
          color="purple"
          trend="normal"
        />
        <MetricCard
          title="Failed Batches"
          value={queueDepth?.database_checkpoints?.failed || 0}
          subtitle="Needs attention"
          icon={<AlertTriangle />}
          color="red"
          trend={queueDepth?.database_checkpoints?.failed > 0 ? 'critical' : 'normal'}
        />
      </div>

      {/* Two Column Layout */}
      <div className="monitoring-grid">
        {/* Left Column */}
        <div className="monitoring-column">
          {/* ERP Call Rate Graph */}
          <div className="monitoring-section">
            <div className="section-header">
              <h2><TrendingUp size={20} /> ERP Call Rate</h2>
              <span className="time-range">Last 20 Minutes</span>
            </div>
            
            {erpCallRate.length > 0 ? (
              <>
                <div className="call-rate-chart">
                  {erpCallRate.map((point, idx) => {
                    const maxBatches = Math.max(...erpCallRate.map(p => p.batches_per_minute || 0));
                    const heightPercent = maxBatches > 0 
                      ? (point.batches_per_minute / maxBatches) * 100 
                      : 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className="chart-bar-container"
                        title={`${point.batches_per_minute} calls at ${new Date(point.timestamp).toLocaleTimeString()}`}
                      >
                        <div 
                          className="chart-bar" 
                          style={{ 
                            height: `${Math.max(heightPercent, 2)}%`,
                            backgroundColor: point.batches_per_minute > 40 ? '#ef4444' : '#10b981'
                          }}
                        />
                        <span className="chart-label">
                          {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="chart-summary">
                  <div className="summary-stat">
                    <span className="summary-label">Total Calls (Last Hour):</span>
                    <span className="summary-value">
                      {erpCallRate.reduce((sum, p) => sum + (p.batches_per_minute || 0), 0)}
                    </span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-label">Avg Calls/Min:</span>
                    <span className="summary-value">
                      {erpCallRate.length > 0 
                        ? Math.round(erpCallRate.reduce((sum, p) => sum + (p.batches_per_minute || 0), 0) / erpCallRate.length)
                        : 0
                      }
                    </span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-label">Peak:</span>
                    <span className="summary-value">
                      {Math.max(...erpCallRate.map(p => p.batches_per_minute || 0))} calls/min
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data-message">
                <Clock size={32} />
                <p>No call rate data available yet</p>
              </div>
            )}
          </div>

          {/* Tenant Throughput */}
          <div className="monitoring-section">
            <div className="section-header">
              <h2><Server size={20} /> Tenant Throughput</h2>
              <span className="time-range">Last 10 Minutes</span>
            </div>
            
            {tenantThroughput.length > 0 ? (
              <div className="throughput-list">
                {tenantThroughput.map((tenant, idx) => (
                  <div key={idx} className="throughput-item">
                    <div className="throughput-header">
                      <span className="tenant-id">{tenant.tenant_id}</span>
                      <span className="throughput-rate">
                        {tenant.records_per_minute.toFixed(0)} rec/min
                      </span>
                    </div>
                    <div className="throughput-stats">
                      <span className="throughput-stat">
                        <strong>{tenant.records_synced}</strong> records
                      </span>
                      <span className="throughput-stat">
                        <strong>{tenant.batches_completed}</strong> batches
                      </span>
                      <span className="throughput-stat">
                        <strong>{tenant.duration_minutes.toFixed(1)}</strong> min
                      </span>
                    </div>
                    <div className="throughput-bar">
                      <div 
                        className="throughput-fill" 
                        style={{ 
                          width: `${Math.min((tenant.records_per_minute / 1000) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <Server size={32} />
                <p>No active tenant sync operations</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="monitoring-column">
          {/* Worker Health */}
          <div className="monitoring-section">
            <div className="section-header">
              <h2><CheckCircle size={20} /> Worker Health</h2>
              <span className="worker-count">{workerHealth.length} Workers Active</span>
            </div>
            
            {workerHealth.length > 0 ? (
              <div className="workers-grid">
                {workerHealth.map((worker, idx) => (
                  <div key={idx} className="worker-card">
                    <div className="worker-header">
                      <span className="worker-name" title={worker.worker_name}>
                        {worker.worker_name.split('@')[0]}
                      </span>
                      <span className={`worker-status ${worker.status}`}>
                        <CheckCircle size={14} />
                        {worker.status}
                      </span>
                    </div>
                    <div className="worker-stats">
                      <div className="stat">
                        <span className="stat-label">Queue</span>
                        <span className="stat-value queue-badge">{worker.queue}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Active</span>
                        <span className="stat-value">{worker.active_tasks}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value">{worker.total_tasks_completed}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Pool</span>
                        <span className="stat-value">{worker.pool_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <Server size={32} />
                <p>No workers detected. Please start Celery workers.</p>
              </div>
            )}
          </div>

          {/* Database Checkpoint Summary */}
          <div className="monitoring-section">
            <div className="section-header">
              <h2><Clock size={20} /> Checkpoint Status</h2>
            </div>
            
            <div className="checkpoint-summary">
              <div className="checkpoint-stat pending">
                <div className="checkpoint-icon">
                  <Clock size={20} />
                </div>
                <div className="checkpoint-info">
                  <span className="checkpoint-label">Pending</span>
                  <span className="checkpoint-value">
                    {queueDepth?.database_checkpoints?.pending || 0}
                  </span>
                </div>
              </div>
              
              <div className="checkpoint-stat queued">
                <div className="checkpoint-icon">
                  <Activity size={20} />
                </div>
                <div className="checkpoint-info">
                  <span className="checkpoint-label">Queued</span>
                  <span className="checkpoint-value">
                    {queueDepth?.database_checkpoints?.queued || 0}
                  </span>
                </div>
              </div>
              
              <div className="checkpoint-stat processing">
                <div className="checkpoint-icon">
                  <RefreshCw size={20} className="spin-slow" />
                </div>
                <div className="checkpoint-info">
                  <span className="checkpoint-label">Processing</span>
                  <span className="checkpoint-value">
                    {queueDepth?.database_checkpoints?.processing || 0}
                  </span>
                </div>
              </div>
              
              <div className="checkpoint-stat completed">
                <div className="checkpoint-icon">
                  <CheckCircle size={20} />
                </div>
                <div className="checkpoint-info">
                  <span className="checkpoint-label">Completed</span>
                  <span className="checkpoint-value">
                    {queueDepth?.database_checkpoints?.completed || 0}
                  </span>
                </div>
              </div>
              
              <div className="checkpoint-stat failed">
                <div className="checkpoint-icon">
                  <XCircle size={20} />
                </div>
                <div className="checkpoint-info">
                  <span className="checkpoint-label">Failed</span>
                  <span className="checkpoint-value">
                    {queueDepth?.database_checkpoints?.failed || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Failed Batches Table (Full Width) */}
      <div className="monitoring-section full-width">
        <div className="section-header">
          <h2><AlertTriangle size={20} /> Recent Failed Batches</h2>
          <span className="failed-count">
            {failedBatches.length > 0 ? `${failedBatches.length} Failures` : 'No Failures'}
          </span>
        </div>
        
        {failedBatches.length === 0 ? (
          <div className="no-failures">
            <CheckCircle size={48} color="#10b981" />
            <h3>✅ All Systems Operational</h3>
            <p>No failed batches detected. Your ETL pipeline is running smoothly!</p>
          </div>
        ) : (
          <div className="failed-batches-table">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Model</th>
                  <th>Batch Range</th>
                  <th>Retries</th>
                  <th>Error</th>
                  <th>Failed At</th>
                </tr>
              </thead>
              <tbody>
                {failedBatches.map((batch, idx) => (
                  <tr key={idx} className="failed-row">
                    <td>
                      <span className="tenant-badge">{batch.tenant_id}</span>
                    </td>
                    <td className="model-cell">{batch.model}</td>
                    <td className="range-cell">{batch.batch_range}</td>
                    <td>
                      <span className="retry-badge">{batch.retry_count}/3</span>
                    </td>
                    <td className="error-cell" title={batch.error}>
                      {batch.error}
                    </td>
                    <td className="time-cell">
                      {new Date(batch.failed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dashboard Footer */}
      <div className="dashboard-footer">
        <div className="footer-left">
          <Clock size={16} />
          <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</span>
        </div>
        <div className="footer-right">
          {autoRefresh && (
            <span className="auto-refresh-indicator">
              <RefreshCw size={14} className="spin-slow" />
              Auto-refreshing every 5 seconds
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REUSABLE METRIC CARD COMPONENT
// ============================================================================
const MetricCard = ({ title, value, subtitle, icon, color, trend = 'normal' }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'warning':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'critical':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return null;
    }
  };

  return (
    <div className={`metric-card ${color} ${trend !== 'normal' ? 'alert' : ''}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-title-row">
          <h3>{title}</h3>
          {getTrendIcon()}
        </div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;