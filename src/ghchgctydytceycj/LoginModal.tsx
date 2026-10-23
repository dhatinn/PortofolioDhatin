import React, { useState } from "react";
import { FiLock, FiEye, FiEyeOff, FiX, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { usePortfolio } from "../context/PortfolioContext";
import "./styles/Admin.css";

const LoginModal: React.FC = () => {
  const { isLoginOpen, closeLoginModal, login } = usePortfolio();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoginOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Masukkan username dan password");
      return;
    }

    const success = login(username, password);
    if (!success) {
      setError("Username atau password salah! Coba default: admin / admin123");
    } else {
      setUsername("");
      setPassword("");
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
            <label>Username / Email</label>
            <div className="admin-input-wrap">
              <input
                type="text"
                className="admin-input"
                placeholder="Contoh: admin atau email Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

          <button type="submit" className="admin-submit-btn">
            <span>Masuk ke Dashboard</span>
            <FiArrowRight />
          </button>
        </form>

        <div className="admin-credentials-hint">
          Akun default: <code>admin</code> &bull; Password: <code>admin123</code>
          <br />
          <span style={{ fontSize: "11px", opacity: 0.7 }}>
            (Password dapat diubah setelah login)
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
