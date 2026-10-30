import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { usePortfolio } from "../context/PortfolioContext";
import AdminDashboard from "./AdminDashboard";
import "./styles/Admin.css";

const AdminPage: React.FC = () => {
  const { isAuthenticated, isAuthLoading, authError, login } = usePortfolio();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your Supabase admin email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="spacefox-login-viewport">
        <div className="spacefox-auth-status" role="status" aria-live="polite">
          <span className="spacefox-auth-spinner" aria-hidden="true" />
          <span>Memverifikasi sesi admin...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AdminDashboard isStandalonePage={true} />;
  }

  return (
    <div className="spacefox-login-viewport">
      {/* Top Left Return Link */}
      <Link
        to="/"
        className="spacefox-back-link"
        title="Return to portfolio"
        onClick={() => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("portfolio_loaded", "true");
          }
        }}
      >
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

          {authError && !error && (
            <div className="spacefox-error-alert" role="alert">
              <FiAlertCircle />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="spacefox-form">
            {/* Email field with floating underline */}
            <div className="spacefox-field">
              <label htmlFor="spacefox-email" className="spacefox-label">
                Email address
              </label>
              <div className="spacefox-input-wrap">
                <input
                  id="spacefox-email"
                  type="email"
                  className="spacefox-input"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

          <p>Sign in with the admin account configured in Supabase.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
