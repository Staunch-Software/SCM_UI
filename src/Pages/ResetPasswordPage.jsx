// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/userService'; // We need to add the new functions here
import '../styles/LoginPage.css'; // Reuse styles

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No reset token found. The link may be invalid.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await authAPI.resetPassword(token, password);
      setSuccess(response.message + ' You will be redirected to login shortly.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Reset Your Password</h2>
        {!success ? (
          <form onSubmit={handleSubmit} className="login-form">
            {error && <p className="error-message">{error}</p>}
            <div className="input-wrapper">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="New Password"
                disabled={isLoading || !token}
              />
            </div>
            <div className="input-wrapper">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm New Password"
                disabled={isLoading || !token}
              />
            </div>
            <button type="submit" className="login-button" disabled={isLoading || !token}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;