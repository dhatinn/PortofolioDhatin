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
import { AdminPage } from "./ghchgctydytceycj";

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
          <Route
            path="/ghchgctydytceycj"
            element={
              <Suspense fallback={<div style={{ minHeight: "100vh", background: "#08060c", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff7a00" }}>Memuat Control Center...</div>}>
                <AdminPage />
              </Suspense>
            }
          />
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
      </BrowserRouter>
    </PortfolioProvider>
  );
};

export default App;
