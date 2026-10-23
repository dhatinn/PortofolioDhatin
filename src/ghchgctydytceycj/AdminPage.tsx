import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiArrowLeft,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
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
      setError("Mohon isi username dan password Anda.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const ok = login(username, password);
      setIsSubmitting(false);
      if (!ok) {
        setError("Username atau password salah! Coba default: admin / admin123");
      }
    }, 250);
  };

  // If already logged in, show the full-screen standalone Admin Dashboard
  if (isAuthenticated) {
    return <AdminDashboard isStandalonePage={true} />;
  }

  // Standalone Clean Login Page
  return (
    <div className="admin-page-login-wrap">
      {/* Ambient background glow */}
      <div className="admin-login-glow-bg" />

      {/* Return to website button */}
      <Link to="/" className="admin-back-to-web-link">
        <FiArrowLeft />
        <span>Kembali ke Portofolio</span>
      </Link>

      <div className="admin-standalone-login-card">
        {/* Brand header */}
        <div className="admin-login-brand">
          <div className="admin-login-logo">DN</div>
          <h2>Control Center</h2>
          <p>Portal Pengelolaan Konten & Konfigurasi Portofolio</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <FiAlertCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="admin-user-input">Username / Email</label>
            <div className="admin-input-wrap">
              <span className="admin-input-icon">
                <FiUser />
              </span>
              <input
                id="admin-user-input"
                type="text"
                className="admin-input with-icon"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-pass-input">Password</label>
            <div className="admin-input-wrap">
              <span className="admin-input-icon">
                <FiLock />
              </span>
              <input
                id="admin-pass-input"
                type={showPassword ? "text" : "password"}
                className="admin-input with-icon with-eye"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Memeriksa kredensial...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer-info">
          <div className="admin-hint-pill">
            <FiShield className="hint-icon" />
            <span>
              Kredensial bawaan: <code>admin</code> / <code>admin123</code>
            </span>
          </div>
          <p className="admin-hint-sub">
            Password dan data dapat diubah secara aman di menu Pengaturan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
