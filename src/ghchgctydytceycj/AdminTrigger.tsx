import React from "react";
import { FiShield, FiSettings } from "react-icons/fi";
import { usePortfolio } from "../context/PortfolioContext";
import "./styles/Admin.css";

const AdminTrigger: React.FC = () => {
  const { isAuthenticated, openLoginModal, openAdminDrawer } = usePortfolio();

  return (
    <button
      type="button"
      className={`admin-stealth-trigger ${isAuthenticated ? "is-auth" : ""}`}
      onClick={isAuthenticated ? openAdminDrawer : openLoginModal}
      title={
        isAuthenticated
          ? "Buka Dashboard Admin (Ctrl+Shift+A)"
          : "Owner Portal (Ctrl+Shift+A)"
      }
      aria-label="Admin Portal"
    >
      <span className="stealth-icon">
        {isAuthenticated ? <FiSettings /> : <FiShield />}
      </span>
    </button>
  );
};

export default AdminTrigger;
