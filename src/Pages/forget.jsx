// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// --- Import the authentication service ---
import { authAPI } from '../services/userService';

// --- Import the styles (assuming it's similar to LoginPage.css) ---
import '../styles/LoginPage.css'; // Reusing styles for consistency

const ForgotPasswordPage = () => {
  // --- State Management ---
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // For success messages
  const [error, setError] = useState('');   // For error messages
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Clear previous messages
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    try {
      // Call the new forgotPassword function from our service
      const response = await authAPI.forgotPassword(email);
      
      // On success, display the confirmation message from the backend
      setMessage(response.message);
      setEmail(''); // Clear the input field on success

    } catch (err) {
      console.error('Forgot password request failed:', err);
      // Display a generic error on failure to prevent exposing backend details
      setError('An error occurred. Please try again later.');
    } finally {
      // Always set loading back to false
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-hexagon">
            <svg viewBox="0 0 100 100" className="hexagon-svg">
              <polygon 
                points="50 1 95 25 95 75 50 99 5 75 5 25" 
                className="hexagon-shape"
              />
              <circle cx="50" cy="50" r="20" className="hexagon-inner" />
            </svg>
          </div>
          <h1 className="logo-text">SCM</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="form-title">Reset Password</h2>
          <p className="form-subtitle">Enter your email to receive a reset link.</p>

          {/* Display success or error messages */}
          {/* We only show one message at a time */}
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          {/* Don't show the form again after a success message is displayed */}
          {!message && (
            <>
              <div className={`input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
                <div className="input-glow"></div>
              </div>

              <button type="submit" className="login-button" disabled={isLoading}>
                <span className="button-text">{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
                <div className="button-shimmer"></div>
              </button>
            </>
          )}

          <Link to="/login" className="back-link">
            Back to Login
          </Link>
        </form>
      </div>

      <div className="background-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;