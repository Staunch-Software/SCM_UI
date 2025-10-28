// src/Pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/userService';
import '../styles/LoginPage.css';
import { Eye, EyeClosed } from 'lucide-react';

const LoginPage = () => {
  // --- State for Login Form ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // --- State for Forgot Password Form ---
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // --- Shared State ---
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }
    try {
      await authAPI.login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotPasswordMessage('');
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(forgotPasswordEmail);
      setForgotPasswordMessage(response.message);
      setForgotPasswordEmail('');
    } catch (err) {
      console.error('Forgot password failed:', err);
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If `isForgotPassword` is true, render the password reset form.
  if (isForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-hexagon">
              <svg viewBox="0 0 100 100" className="hexagon-svg">
                <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" className="hexagon-shape" />
                <circle cx="50" cy="50" r="20" className="hexagon-inner" />
              </svg>
            </div>
            <h1 className="logo-text">SCM</h1>
          </div>
          <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '0.5rem' }}>Reset Password</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem' }}>
            Enter your email to receive a reset link.
          </p>
          <form onSubmit={handleForgotPasswordSubmit} className="login-form">
            {error && <p className="error-message">{error}</p>}
            {forgotPasswordMessage && <p className="success-message">{forgotPasswordMessage}</p>}
            <div className={`input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="input-field"
                placeholder="Your Email Address"
                disabled={isLoading}
                required
              />
              <div className="input-glow"></div>
            </div>
            <button type="submit" className="login-button" disabled={isLoading}>
              <span className="button-text">{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
              <div className="button-shimmer"></div>
            </button>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              setIsForgotPassword(false);
              setError('');
              setForgotPasswordMessage('');
            }} className="forgot-link">
              Back to Login
            </a>
          </form>
        </div>
        <div className="background-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>
    );
  }

  // Otherwise, render the default Login Form.
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-hexagon">
            <svg viewBox="0 0 100 100" className="hexagon-svg">
              <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" className="hexagon-shape" />
              <circle cx="50" cy="50" r="20" className="hexagon-inner" />
            </svg>
          </div>
          <h1 className="logo-text">SCM</h1>
        </div>
        <form onSubmit={handleLoginSubmit} className="login-form">
          {error && <p className="error-message">{error}</p>}
          <div className={`input-wrapper ${focusedField === 'username' ? 'focused' : ''}`}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              className="input-field"
              placeholder="Username"
              disabled={isLoading}
            />
            <div className="input-glow"></div>
          </div>
          <div className={`input-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className="input-field"
              placeholder="Password"
              disabled={isLoading}
            />
            <div className="input-glow"></div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              disabled={isLoading}
            >
              {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
            </button>
          </div>
          <label className="remember-checkbox">
            <input type="checkbox" className="checkbox-input" disabled={isLoading} />
            <span className="checkbox-custom"></span>
            <span className="checkbox-label">Remember me</span>
          </label>
          <button type="submit" className="login-button" disabled={isLoading}>
            <span className="button-text">{isLoading ? 'Logging in...' : 'Login'}</span>
            <div className="button-shimmer"></div>
          </button>

          {/* --- THIS IS THE CORRECTED LINK --- */}
          <a href="#" onClick={(e) => {
            e.preventDefault(); // This stops the browser from changing the URL
            setIsForgotPassword(true); // This changes the state to show the other form
            setError(''); // Clear any old errors
          }} className="forgot-link">
            Forgot password?
          </a>

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

export default LoginPage;