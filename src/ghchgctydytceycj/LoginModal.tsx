import React, { useState } from "react";
import { FiLock, FiEye, FiEyeOff, FiX, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { usePortfolio } from "../context/PortfolioContext";
import "./styles/Admin.css";

const LoginModal: React.FC = () => {
  const { isLoginOpen, closeLoginModal, login } = usePortfolio();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Masukkan email dan password akun Supabase Auth");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk ke akun admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={closeLoginModal}>
      <div className="admin-login-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="admin-close-btn"
          onClick={closeLoginModal}
          title="Tutup (Esc)"
        >
          <FiX />
        </button>

        <div className="admin-login-header">
          <div className="admin-login-icon">
            <FiLock />
          </div>
          <h3>Portfolio Admin Portal</h3>
          <p>Masuk untuk mengedit data profil, proyek, dan karir</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Email</label>
            <div className="admin-input-wrap">
              <input
                type="email"
                className="admin-input"
                placeholder="Email akun admin Supabase"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Password</label>
            <div className="admin-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="admin-input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="admin-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-submit-btn" disabled={isSubmitting}>
            <span>{isSubmitting ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
            <FiArrowRight />
          </button>
        </form>

        <div className="admin-credentials-hint">
          Gunakan email dan password akun admin yang dibuat di Supabase.
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
