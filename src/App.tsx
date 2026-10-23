import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";

const MainContainer = lazy(() => import("./components/MainContainer"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const Play = lazy(() => import("./pages/Play"));
import { LoadingProvider } from "./context/LoadingProvider";
import { PortfolioProvider } from "./context/PortfolioContext";
import { LoginModal, AdminDashboard } from "./components/Admin";

import { usePortfolio } from "./context/PortfolioContext";
import { useEffect } from "react";

const AdminDirectRoute = () => {
  const { isAuthenticated, openAdminDrawer, openLoginModal } = usePortfolio();

  useEffect(() => {
    if (isAuthenticated) {
      openAdminDrawer();
    } else {
      openLoginModal();
    }
  }, [isAuthenticated, openAdminDrawer, openLoginModal]);

  return (
    <LoadingProvider>
      <Suspense fallback={null}>
        <MainContainer />
      </Suspense>
    </LoadingProvider>
  );
};

const App = () => {
  return (
    <PortfolioProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <LoadingProvider>
                <Suspense fallback={null}>
                  <MainContainer />
                </Suspense>
              </LoadingProvider>
            }
          />
          <Route path="/admin" element={<AdminDirectRoute />} />
          <Route
            path="/myworks"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <MyWorks />
              </Suspense>
            }
          />
          <Route
            path="/play"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Play />
              </Suspense>
            }
          />
        </Routes>
        <Analytics />
        <SpeedInsights />
        <LoginModal />
        <AdminDashboard />
      </BrowserRouter>
    </PortfolioProvider>
  );
};

export default App;
