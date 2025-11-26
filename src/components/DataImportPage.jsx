import React, { useState } from 'react';
import apiClient from '../services/apiclient';
import '../styles/DataImportPage.css';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DataImportPage = () => {
  const [entityType, setEntityType] = useState('product');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const entities = [
    { id: 'product', label: 'Products' },
    { id: 'bom', label: 'Bill of Materials' },
    { id: 'purchase_order', label: 'Purchase Orders' },
    { id: 'manufacture_order', label: 'Manufacturing Orders' },
    { id: 'sales_order', label: 'Sales Orders' },
    { id: 'supplier', label: 'Suppliers' },
    { id: 'customer', label: 'Customers' },
  ];

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('entity_type', entityType);
    formData.append('file', file);

    try {
      const response = await apiClient.post('/api/import/data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult({ 
        type: 'success', 
        data: response.data 
      });
    } catch (error) {
      setResult({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Upload failed' 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="import-page">
      <div className="import-card">
        <div className="import-header">
          <h1>Data Import</h1>
          <p>Upload CSV or Excel files. Large files will be processed in the background.</p>
        </div>

        <form onSubmit={handleUpload} className="import-form">
          <div className="form-group">
            <label>Select Data Type</label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              {entities.map(ent => (
                <option key={ent.id} value={ent.id}>{ent.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Upload File</label>
            <div className="file-drop-area">
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} id="file-upload" hidden />
              <label htmlFor="file-upload" className="file-upload-label">
                <Upload size={40} className="upload-icon" />
                <span>{file ? file.name : "Click to upload or drag and drop"}</span>
                {/* <span className="file-hint">CSV or Excel files only</span> */}
              </label>
            </div>
          </div>

          <button type="submit" className="import-btn" disabled={!file || uploading}>
            {uploading ? (
              <span className="flex-center"><Loader2 className="spin" size={18} /> Processing...</span>
            ) : 'Start Import'}
          </button>
        </form>

        {result && (
          <div className={`result-box ${result.type}`}>
            {result.type === 'success' ? (
              <>
                <CheckCircle size={20} />
                <div>
                  <h4>Import Started</h4>
                  <p>{result.data.message}</p>
                  <ul className="result-stats">
                    <li>Total Rows: <strong>{result.data.total_rows}</strong></li>
                    <li>Batches Queued: <strong>{result.data.batches_queued}</strong></li>
                  </ul>
                  <small>Check the Dashboard or Odoo for results shortly.</small>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={20} />
                <span>{result.message}</span>
              </>
            )}
          </div>
        )}
        
        <div className="template-help">
            <h3>Required Columns (CSV Headers)</h3>
            {entityType === 'product' && <p>sku, product_name, price, description, item_type</p>}
            {entityType === 'supplier' && <p>supplier_name, email, phone</p>}
            {entityType === 'customer' && <p>customer_name, email, phone, order_reference</p>}
            {entityType === 'bom' && <p>parent_sku, component_sku, quantity</p>}
            {entityType === 'purchase_order' && <p>order_reference, supplier_name, date, sku, quantity, unit_price</p>}
            {entityType === 'sales_order' && <p>order_reference, customer_name, date, sku, quantity, unit_price</p>}
            {entityType === 'manufacture_order' && <p>sku, quantity, start_date</p>}
        </div>
      </div>
    </div>
  );
};

export default DataImportPage;