// src/components/OnboardingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiclient';
import '../styles/OnboardingPage.css';

const OnboardingPage = () => {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [erpType, setErpType] = useState('odoo');
  const [erpUrl, setErpUrl] = useState('');
  const [erpDb, setErpDb] = useState('');
  const [erpUsername, setErpUsername] = useState('');
  const [erpPassword, setErpPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = {
      erp_type: erpType,
      erp_credentials: {
        odoo_url: erpUrl,
        odoo_db: erpDb,
        odoo_username: erpUsername,
        odoo_password: erpPassword,
      },
    };

    try {
      await apiClient.post(`/api/onboarding/${tenant.tenant_id}/configure-erp`, payload);
      // On success, navigate to the syncing page
      navigate('/syncing-data', { replace: true });
    } catch (err) {
      console.error("ERP Configuration failed:", err);
      setError(err.response?.data?.detail || "Failed to connect to ERP. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!tenant) {
    return <div>Loading tenant information...</div>;
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h1>Welcome, {tenant.tenant_name}!</h1>
        <p>Let's connect your ERP system to get started.</p>
        
        <form onSubmit={handleSubmit} className="onboarding-form">
          {error && <p className="onboarding-error">{error}</p>}
          
          <div className="form-group">
            <label htmlFor="erpType">ERP System</label>
            <select id="erpType" value={erpType} onChange={(e) => setErpType(e.target.value)}>
              <option value="odoo">Odoo</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="erpUrl">Odoo URL</label>
            <input id="erpUrl" type="text" value={erpUrl} onChange={(e) => setErpUrl(e.target.value)} placeholder="e.g., https://mycompany.odoo.com" required />
          </div>

          <div className="form-group">
            <label htmlFor="erpDb">Odoo Database Name</label>
            <input id="erpDb" type="text" value={erpDb} onChange={(e) => setErpDb(e.target.value)} placeholder="e.g., mycompany-db" required />
          </div>

          <div className="form-group">
            <label htmlFor="erpUsername">Odoo Username</label>
            <input id="erpUsername" type="text" value={erpUsername} onChange={(e) => setErpUsername(e.target.value)} placeholder="Your Odoo login email" required />
          </div>

          <div className="form-group">
            <label htmlFor="erpPassword">Odoo Password / API Key</label>
            <input id="erpPassword" type="password" value={erpPassword} onChange={(e) => setErpPassword(e.target.value)} required />
          </div>

          <button type="submit" className="onboarding-button" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect and Start Sync'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;


// import React, { useState, useEffect } from 'react';
// import { CheckCircle, AlertCircle, Loader2, Database, Link2, Settings, MapPin } from 'lucide-react';
// import apiClient from '../services/apiclient';

// const OnboardingPage = ({ tenantId, onComplete }) => {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
  
//   // ERP Selection
//   const [erpTypes, setErpTypes] = useState([]);
//   const [selectedErp, setSelectedErp] = useState(null);
  
//   // ERP Credentials
//   const [credentials, setCredentials] = useState({
//     erp_url: '',
//     database_name: '',
//     username: '',
//     password: '',
//     api_key: '',
//     api_secret: ''
//   });
  
//   // Connection Status
//   const [isConnected, setIsConnected] = useState(false);
//   const [extractedFields, setExtractedFields] = useState(null);
  
//   // Field Mappings
//   const [fieldMappings, setFieldMappings] = useState({});

//   // Load ERP types on mount
//   useEffect(() => {
//     loadErpTypes();
//   }, []);

//   const loadErpTypes = async () => {
//     try {
//       const response = await apiClient.get('/api/erp-types');
//       setErpTypes(response.data);
//     } catch (err) {
//       setError('Failed to load ERP types');
//     }
//   };

//   const handleErpSelect = (erpType) => {
//     setSelectedErp(erpType);
//     setError('');
//   };

//   const testConnection = async () => {
//     setLoading(true);
//     setError('');
//     setSuccess('');
    
//     try {
//       const response = await apiClient.post(
//         `/api/tenants/${tenantId}/erp-config/test`,
//         {
//           erp_type: selectedErp.erp_type,
//           ...credentials
//         }
//       );
      
//       if (response.data.success) {
//         setSuccess('✅ Connection successful!');
//         setIsConnected(true);
        
//         // Extract fields if not standalone
//         if (selectedErp.erp_type !== 'standalone') {
//           await extractFields();
//         }
//       } else {
//         setError(response.data.message);
//         setIsConnected(false);
//       }
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Connection failed');
//       setIsConnected(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const extractFields = async () => {
//     try {
//       const response = await apiClient.post(
//         `/api/tenants/${tenantId}/erp-config/extract-fields`,
//         {
//           erp_type: selectedErp.erp_type,
//           ...credentials
//         }
//       );
      
//       if (response.data.success) {
//         setExtractedFields(response.data.extracted_fields);
//       }
//     } catch (err) {
//       console.error('Field extraction failed:', err);
//     }
//   };

//   const saveConfiguration = async () => {
//     setLoading(true);
//     setError('');
    
//     try {
//       // Save ERP configuration
//       await apiClient.post(
//         `/api/tenants/${tenantId}/erp-config`,
//         {
//           erp_type: selectedErp.erp_type,
//           ...credentials,
//           auto_sync_enabled: true,
//           sync_frequency_hours: 24
//         }
//       );
      
//       // Create default field mappings
//       await apiClient.post(
//         `/api/tenants/${tenantId}/field-mappings/bulk`
//       );
      
//       setSuccess('✅ Configuration saved! Setting up your database...');
      
//       // Wait a bit for background provisioning to start
//       setTimeout(() => {
//         onComplete();
//       }, 2000);
      
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Failed to save configuration');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const nextStep = () => {
//     if (currentStep === 1 && !selectedErp) {
//       setError('Please select an ERP type');
//       return;
//     }
//     if (currentStep === 2 && !isConnected) {
//       setError('Please test and verify your connection first');
//       return;
//     }
//     setCurrentStep(currentStep + 1);
//     setError('');
//   };

//   const prevStep = () => {
//     setCurrentStep(currentStep - 1);
//     setError('');
//   };

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: '2rem'
//     }}>
//       <div style={{
//         background: 'white',
//         borderRadius: '1rem',
//         boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
//         maxWidth: '800px',
//         width: '100%',
//         padding: '3rem'
//       }}>
//         {/* Header */}
//         <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
//           <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
//             Welcome to Your Supply Chain Platform
//           </h1>
//           <p style={{ color: '#718096' }}>
//             Let's set up your ERP integration to get started
//           </p>
//         </div>

//         {/* Progress Steps */}
//         <div style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           marginBottom: '3rem',
//           position: 'relative'
//         }}>
//           {[
//             { num: 1, label: 'Choose ERP', icon: Database },
//             { num: 2, label: 'Connect', icon: Link2 },
//             { num: 3, label: 'Configure', icon: Settings },
//             { num: 4, label: 'Complete', icon: CheckCircle }
//           ].map((step, idx) => {
//             const Icon = step.icon;
//             const isActive = currentStep === step.num;
//             const isCompleted = currentStep > step.num;
            
//             return (
//               <div key={step.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
//                 {idx > 0 && (
//                   <div style={{
//                     position: 'absolute',
//                     top: '1.5rem',
//                     right: '50%',
//                     left: '-50%',
//                     height: '2px',
//                     background: isCompleted ? '#667eea' : '#e2e8f0',
//                     zIndex: 0
//                   }} />
//                 )}
//                 <div style={{
//                   width: '3rem',
//                   height: '3rem',
//                   borderRadius: '50%',
//                   background: isActive ? '#667eea' : isCompleted ? '#48bb78' : '#e2e8f0',
//                   color: 'white',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   marginBottom: '0.5rem',
//                   position: 'relative',
//                   zIndex: 1
//                 }}>
//                   <Icon size={20} />
//                 </div>
//                 <span style={{
//                   fontSize: '0.875rem',
//                   color: isActive ? '#667eea' : '#718096',
//                   fontWeight: isActive ? 'bold' : 'normal'
//                 }}>
//                   {step.label}
//                 </span>
//               </div>
//             );
//           })}
//         </div>

//         {/* Error/Success Messages */}
//         {error && (
//           <div style={{
//             background: '#fed7d7',
//             border: '1px solid #fc8181',
//             borderRadius: '0.5rem',
//             padding: '1rem',
//             marginBottom: '1.5rem',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '0.5rem'
//           }}>
//             <AlertCircle size={20} color="#c53030" />
//             <span style={{ color: '#c53030' }}>{error}</span>
//           </div>
//         )}

//         {success && (
//           <div style={{
//             background: '#c6f6d5',
//             border: '1px solid #68d391',
//             borderRadius: '0.5rem',
//             padding: '1rem',
//             marginBottom: '1.5rem',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '0.5rem'
//           }}>
//             <CheckCircle size={20} color="#2f855a" />
//             <span style={{ color: '#2f855a' }}>{success}</span>
//           </div>
//         )}

//         {/* Step 1: Choose ERP */}
//         {currentStep === 1 && (
//           <div>
//             <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#2d3748' }}>
//               Choose Your ERP System
//             </h2>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
//               {erpTypes.map((erp) => (
//                 <button
//                   key={erp.erp_type}
//                   onClick={() => handleErpSelect(erp)}
//                   style={{
//                     padding: '1.5rem',
//                     border: selectedErp?.erp_type === erp.erp_type ? '2px solid #667eea' : '2px solid #e2e8f0',
//                     borderRadius: '0.5rem',
//                     background: selectedErp?.erp_type === erp.erp_type ? '#edf2f7' : 'white',
//                     cursor: 'pointer',
//                     transition: 'all 0.2s',
//                     textAlign: 'left'
//                   }}
//                 >
//                   <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>
//                     {erp.display_name}
//                   </h3>
//                   <p style={{ fontSize: '0.875rem', color: '#718096' }}>
//                     {erp.description}
//                   </p>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Step 2: Enter Credentials */}
//         {currentStep === 2 && selectedErp && (
//           <div>
//             <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#2d3748' }}>
//               Connect to {selectedErp.display_name}
//             </h2>
            
//             {selectedErp.erp_type !== 'standalone' ? (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//                 {selectedErp.requires_url && (
//                   <div>
//                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
//                       ERP URL *
//                     </label>
//                     <input
//                       type="url"
//                       value={credentials.erp_url}
//                       onChange={(e) => setCredentials({ ...credentials, erp_url: e.target.value })}
//                       placeholder="https://your-erp-instance.com"
//                       style={{
//                         width: '100%',
//                         padding: '0.75rem',
//                         border: '1px solid #cbd5e0',
//                         borderRadius: '0.375rem',
//                         fontSize: '1rem'
//                       }}
//                     />
//                   </div>
//                 )}
                
//                 {selectedErp.requires_database && (
//                   <div>
//                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
//                       Database Name *
//                     </label>
//                     <input
//                       type="text"
//                       value={credentials.database_name}
//                       onChange={(e) => setCredentials({ ...credentials, database_name: e.target.value })}
//                       placeholder="your_database"
//                       style={{
//                         width: '100%',
//                         padding: '0.75rem',
//                         border: '1px solid #cbd5e0',
//                         borderRadius: '0.375rem',
//                         fontSize: '1rem'
//                       }}
//                     />
//                   </div>
//                 )}
                
//                 {selectedErp.requires_username && (
//                   <div>
//                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
//                       Username *
//                     </label>
//                     <input
//                       type="text"
//                       value={credentials.username}
//                       onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
//                       placeholder="admin@example.com"
//                       style={{
//                         width: '100%',
//                         padding: '0.75rem',
//                         border: '1px solid #cbd5e0',
//                         borderRadius: '0.375rem',
//                         fontSize: '1rem'
//                       }}
//                     />
//                   </div>
//                 )}
                
//                 {selectedErp.requires_password && (
//                   <div>
//                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
//                       Password *
//                     </label>
//                     <input
//                       type="password"
//                       value={credentials.password}
//                       onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
//                       placeholder="••••••••"
//                       style={{
//                         width: '100%',
//                         padding: '0.75rem',
//                         border: '1px solid #cbd5e0',
//                         borderRadius: '0.375rem',
//                         fontSize: '1rem'
//                       }}
//                     />
//                   </div>
//                 )}
                
//                 <button
//                   onClick={testConnection}
//                   disabled={loading}
//                   style={{
//                     padding: '0.75rem 1.5rem',
//                     background: '#667eea',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '0.375rem',
//                     fontWeight: 'bold',
//                     cursor: loading ? 'not-allowed' : 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: '0.5rem',
//                     opacity: loading ? 0.7 : 1
//                   }}
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
//                       Testing Connection...
//                     </>
//                   ) : (
//                     <>Test Connection</>
//                   )}
//                 </button>
                
//                 {isConnected && (
//                   <div style={{
//                     padding: '1rem',
//                     background: '#c6f6d5',
//                     borderRadius: '0.375rem',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '0.5rem'
//                   }}>
//                     <CheckCircle size={20} color="#2f855a" />
//                     <span style={{ color: '#2f855a', fontWeight: '500' }}>
//                       Connection verified! Fields extracted successfully.
//                     </span>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div style={{
//                 padding: '2rem',
//                 background: '#edf2f7',
//                 borderRadius: '0.5rem',
//                 textAlign: 'center'
//               }}>
//                 <Database size={48} style={{ margin: '0 auto 1rem', color: '#667eea' }} />
//                 <p style={{ color: '#2d3748', marginBottom: '1rem' }}>
//                   You've selected Standalone mode. This application will serve as your primary ERP system.
//                 </p>
//                 <button
//                   onClick={() => {
//                     setIsConnected(true);
//                     setSuccess('Ready to proceed with standalone setup');
//                   }}
//                   style={{
//                     padding: '0.75rem 2rem',
//                     background: '#667eea',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '0.375rem',
//                     fontWeight: 'bold',
//                     cursor: 'pointer'
//                   }}
//                 >
//                   Continue with Standalone
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Step 3: Review Configuration */}
//         {currentStep === 3 && (
//           <div>
//             <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#2d3748' }}>
//               Review Your Configuration
//             </h2>
            
//             <div style={{
//               padding: '1.5rem',
//               background: '#f7fafc',
//               borderRadius: '0.5rem',
//               marginBottom: '1.5rem'
//             }}>
//               <div style={{ marginBottom: '1rem' }}>
//                 <span style={{ fontWeight: 'bold', color: '#2d3748' }}>ERP Type:</span>
//                 <span style={{ marginLeft: '0.5rem', color: '#718096' }}>{selectedErp.display_name}</span>
//               </div>
              
//               {selectedErp.erp_type !== 'standalone' && (
//                 <>
//                   {credentials.erp_url && (
//                     <div style={{ marginBottom: '1rem' }}>
//                       <span style={{ fontWeight: 'bold', color: '#2d3748' }}>URL:</span>
//                       <span style={{ marginLeft: '0.5rem', color: '#718096' }}>{credentials.erp_url}</span>
//                     </div>
//                   )}
                  
//                   {credentials.database_name && (
//                     <div style={{ marginBottom: '1rem' }}>
//                       <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Database:</span>
//                       <span style={{ marginLeft: '0.5rem', color: '#718096' }}>{credentials.database_name}</span>
//                     </div>
//                   )}
                  
//                   {extractedFields && (
//                     <div>
//                       <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Extracted Entities:</span>
//                       <span style={{ marginLeft: '0.5rem', color: '#718096' }}>
//                         {Object.keys(extractedFields).length} entity types ready for sync
//                       </span>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
            
//             <div style={{
//               padding: '1rem',
//               background: '#bee3f8',
//               borderRadius: '0.375rem',
//               marginBottom: '1.5rem'
//             }}>
//               <p style={{ color: '#2c5282', fontSize: '0.875rem' }}>
//                 ℹ️ By clicking "Complete Setup", we will:
//               </p>
//               <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', color: '#2c5282', fontSize: '0.875rem' }}>
//                 <li>Create your dedicated database</li>
//                 <li>Set up all necessary tables</li>
//                 <li>Create field mappings</li>
//                 {selectedErp.erp_type !== 'standalone' && (
//                   <li>Start initial data synchronization from your ERP</li>
//                 )}
//               </ul>
//             </div>
            
//             <button
//               onClick={saveConfiguration}
//               disabled={loading}
//               style={{
//                 width: '100%',
//                 padding: '1rem',
//                 background: '#48bb78',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '0.375rem',
//                 fontSize: '1.125rem',
//                 fontWeight: 'bold',
//                 cursor: loading ? 'not-allowed' : 'pointer',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 gap: '0.5rem',
//                 opacity: loading ? 0.7 : 1
//               }}
//             >
//               {loading ? (
//                 <>
//                   <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
//                   Setting up your environment...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle size={24} />
//                   Complete Setup
//                 </>
//               )}
//             </button>
//           </div>
//         )}

//         {/* Navigation Buttons */}
//         {currentStep < 3 && (
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             marginTop: '2rem',
//             paddingTop: '2rem',
//             borderTop: '1px solid #e2e8f0'
//           }}>
//             {currentStep > 1 && (
//               <button
//                 onClick={prevStep}
//                 style={{
//                   padding: '0.75rem 2rem',
//                   background: '#e2e8f0',
//                   color: '#2d3748',
//                   border: 'none',
//                   borderRadius: '0.375rem',
//                   fontWeight: 'bold',
//                   cursor: 'pointer'
//                 }}
//               >
//                 Back
//               </button>
//             )}
            
//             <button
//               onClick={nextStep}
//               style={{
//                 padding: '0.75rem 2rem',
//                 background: '#667eea',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '0.375rem',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//                 marginLeft: 'auto'
//               }}
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </div>
      
//       <style>{`
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default OnboardingPage;