import React from "react";
import { FiLock, FiSettings } from "react-icons/fi";
import { usePortfolio } from "../../context/PortfolioContext";
import "./styles/Admin.css";

const AdminTrigger: React.FC = () => {
  const { isAuthenticated, openLoginModal, openAdminDrawer } = usePortfolio();

  return (
    <button
      className={`admin-secret-trigger ${isAuthenticated ? "authenticated" : ""}`}
      onClick={isAuthenticated ? openAdminDrawer : openLoginModal}
      title={
        isAuthenticated
          ? "Buka Dashboard Admin (Ctrl+Shift+A)"
          : "Admin Login (Ctrl+Shift+A)"
      }
      aria-label="Admin Access"
    >
      <span className="admin-trigger-dot"></span>
      {isAuthenticated ? (
        <>
          <FiSettings style={{ fontSize: "12px" }} />
          <span>Dashboard</span>
        </>
      ) : (
        <>
          <FiLock style={{ fontSize: "11px" }} />
          <span>Admin</span>
        </>
      )}
    </button>
  );
};

export default AdminTrigger;
