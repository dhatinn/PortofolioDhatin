import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiCheck, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { usePortfolio } from "../context/PortfolioContext";
import AdminDashboard from "./AdminDashboard";
import "./styles/Admin.css";

const AdminPage: React.FC = () => {
  const { isAuthenticated, login } = usePortfolio();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Please fill in both username and password");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const ok = login(username, password);
      setIsSubmitting(false);
      if (!ok) {
        setError("Invalid username or password. (Default: admin / admin123)");
      }
    }, 200);
  };

  const handleFillDefaults = () => {
    setUsername("admin");
    setPassword("admin123");
    setError(null);
  };

  // If already authenticated, show the standalone Admin Dashboard
  if (isAuthenticated) {
    return <AdminDashboard isStandalonePage={true} />;
  }

  return (
    <div className="spacefox-login-viewport">
      {/* Top Left Return Link */}
      <Link to="/" className="spacefox-back-link" title="Return to portfolio">
        <FiArrowLeft />
        <span>WEBSITE</span>
      </Link>

      {/* Center 3D Dark Planet / Orb Container */}
      <div className="spacefox-orb-container">
        <div className="spacefox-orb-body">
          {/* Logo / Title */}
          <div className="spacefox-brand">
            <h1 className="spacefox-logo">WELCOME SANDY!</h1>
          </div>

          {error && (
            <div className="spacefox-error-alert">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="spacefox-form">
            {/* Email / Username field with floating underline */}
            <div className="spacefox-field">
              <label htmlFor="spacefox-email" className="spacefox-label">
                Email address
              </label>
              <div className="spacefox-input-wrap">
                <input
                  id="spacefox-email"
                  type="text"
                  className="spacefox-input"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password field with floating underline */}
            <div className="spacefox-field">
              <label htmlFor="spacefox-password" className="spacefox-label">
                Password
              </label>
              <div className="spacefox-input-wrap">
                <input
                  id="spacefox-password"
                  type={showPassword ? "text" : "password"}
                  className="spacefox-input password-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="spacefox-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="spacefox-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          {/* Bottom verified squircle button with glowing amber/coral rim */}
          <div className="spacefox-bottom-widget">
            <button
              type="button"
              className="spacefox-verified-btn"
              onClick={handleFillDefaults}
              title="Quick Auth Fill (admin / admin123)"
            >
              <FiCheck className="verified-check-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
