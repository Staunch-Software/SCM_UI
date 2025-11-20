import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Database, Settings, Zap } from 'lucide-react';
import apiClient from '../services/apiclient';

const ERPOnboardingWizard = ({ tenantId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedERP, setSelectedERP] = useState(null);
  const [erpCredentials, setERPCredentials] = useState({
    erp_url: '',
    database_name: '',
    username: '',
    password: ''
  });
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const erpOptions = [
    {
      type: 'odoo',
      name: 'Odoo ERP',
      description: 'Open-source ERP with comprehensive modules',
      icon: '🟣',
      requiresUrl: true,
      requiresDatabase: true,
      requiresUsername: true,
      requiresPassword: true
    },
    {
      type: 'sap',
      name: 'SAP',
      description: 'Enterprise resource planning software',
      icon: '🔵',
      requiresUrl: true,
      requiresDatabase: false,
      requiresUsername: true,
      requiresPassword: true
    },
    {
      type: 'standalone',
      name: 'No ERP (Standalone)',
      description: 'Use this application as your primary ERP system',
      icon: '⚡',
      requiresUrl: false,
      requiresDatabase: false,
      requiresUsername: false,
      requiresPassword: false
    }
  ];

  // STEP 1: Choose ERP
  const handleERPSelection = (erp) => {
    setSelectedERP(erp);
    setError('');
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedERP) {
      setError('Please select an ERP system');
      return;
    }
    
    if (selectedERP?.type === 'standalone') {
      // Skip credentials step for standalone
      handleSaveStandalone();
    } else {
      setCurrentStep(2);
    }
  };

  // STEP 2: Test Connection
  const handleTestConnection = async () => {
    setIsLoading(true);
    setError('');
    setTestResult(null);

    try {
      const response = await apiClient.post(
        `/api/tenants/${tenantId}/erp-config/test`,
        {
          erp_type: selectedERP.type,
          ...erpCredentials
        }
      );

      setTestResult(response.data);
      
      if (response.data.success) {
        // Auto-advance after successful test
        setTimeout(() => setCurrentStep(3), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Connection test failed');
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Save Configuration & Create Mappings
  const handleSaveConfiguration = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Save ERP config
      await apiClient.post(`/api/tenants/${tenantId}/erp-config`, {
        erp_type: selectedERP.type,
        ...erpCredentials,
        auto_sync_enabled: true,
        sync_frequency_hours: 24
      });

      // Auto-create field mappings
      await apiClient.post(`/api/tenants/${tenantId}/field-mappings/auto-create`);

      // Complete onboarding
      await apiClient.post(`/api/tenants/${tenantId}/onboarding/complete`);

      // Success - redirect to dashboard
      onComplete();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Standalone Setup
  const handleSaveStandalone = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Save standalone config
      await apiClient.post(`/api/tenants/${tenantId}/erp-config`, {
        erp_type: 'standalone',
        auto_sync_enabled: false,
        sync_frequency_hours: 0
      });

      // Auto-create field mappings
      await apiClient.post(`/api/tenants/${tenantId}/field-mappings/auto-create`);

      // Complete onboarding
      await apiClient.post(`/api/tenants/${tenantId}/onboarding/complete`);

      // Success
      onComplete();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '800px',
        width: '100%',
        padding: '3rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
            Welcome to Your Supply Chain Platform! 🎉
          </h1>
          <p style={{ color: '#718096', fontSize: '1rem' }}>
            Let's connect your ERP system to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '3rem',
          position: 'relative'
        }}>
          {[
            { num: 1, label: 'Choose ERP', icon: Database },
            { num: 2, label: 'Configure', icon: Settings },
            { num: 3, label: 'Complete', icon: Zap }
          ].map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            
            return (
              <div key={step.num} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                {idx < 2 && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    width: '100%',
                    height: '2px',
                    backgroundColor: isCompleted ? '#48bb78' : '#e2e8f0',
                    zIndex: 0
                  }} />
                )}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#48bb78' : isActive ? '#667eea' : '#e2e8f0',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 'bold' : 'normal',
                  color: isActive ? '#667eea' : '#718096'
                }}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fed7d7',
            border: '1px solid #fc8181',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={20} color="#c53030" />
            <span style={{ color: '#c53030' }}>{error}</span>
          </div>
        )}

        {/* STEP 1: Choose ERP */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#2d3748' }}>
              Step 1: Choose Your ERP System
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {erpOptions.map((erp) => (
                <div
                  key={erp.type}
                  onClick={() => handleERPSelection(erp)}
                  style={{
                    border: selectedERP?.type === erp.type ? '3px solid #667eea' : '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    backgroundColor: selectedERP?.type === erp.type ? '#f7fafc' : 'white'
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{erp.icon}</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>
                    {erp.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#718096' }}>
                    {erp.description}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={handleNextStep}
              disabled={!selectedERP}
              style={{
                marginTop: '2rem',
                width: '100%',
                padding: '1rem',
                backgroundColor: selectedERP ? '#667eea' : '#cbd5e0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: selectedERP ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s'
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: Configure Credentials */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#2d3748' }}>
              Step 2: Configure {selectedERP?.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedERP?.requiresUrl && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                    ERP URL *
                  </label>
                  <input
                    type="text"
                    value={erpCredentials.erp_url}
                    onChange={(e) => setERPCredentials({ ...erpCredentials, erp_url: e.target.value })}
                    placeholder="https://your-erp.example.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}
              {selectedERP?.requiresDatabase && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                    Database Name *
                  </label>
                  <input
                    type="text"
                    value={erpCredentials.database_name}
                    onChange={(e) => setERPCredentials({ ...erpCredentials, database_name: e.target.value })}
                    placeholder="your_database"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}
              {selectedERP?.requiresUsername && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={erpCredentials.username}
                    onChange={(e) => setERPCredentials({ ...erpCredentials, username: e.target.value })}
                    placeholder="admin@example.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}
              {selectedERP?.requiresPassword && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={erpCredentials.password}
                    onChange={(e) => setERPCredentials({ ...erpCredentials, password: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Test Result */}
            {testResult && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: testResult.success ? '#c6f6d5' : '#fed7d7',
                border: `1px solid ${testResult.success ? '#48bb78' : '#fc8181'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {testResult.success ? (
                  <CheckCircle size={20} color="#22543d" />
                ) : (
                  <AlertCircle size={20} color="#c53030" />
                )}
                <span style={{ color: testResult.success ? '#22543d' : '#c53030' }}>
                  {testResult.message}
                </span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleTestConnection}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isLoading && <Loader2 size={20} className="animate-spin" />}
                Test Connection
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete Setup */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#c6f6d5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem'
            }}>
              <CheckCircle size={40} color="#22543d" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#2d3748' }}>
              Connection Successful!
            </h2>
            <p style={{ color: '#718096', marginBottom: '2rem' }}>
              We're now setting up your workspace and importing data from your ERP.
              This may take a few minutes.
            </p>
            <button
              onClick={handleSaveConfiguration}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#48bb78',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Setting up your workspace...
                </>
              ) : (
                'Complete Setup & Go to Dashboard'
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ERPOnboardingWizard;