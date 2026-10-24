import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import Loading, { setProgress } from "../components/Loading";

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
}

export const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(() => {
    // Skip loading on mobile, admin hash, or if already loaded once in this session
    if (typeof window !== "undefined") {
      if (
        window.innerWidth <= 768 ||
        window.location.hash.includes("admin") ||
        sessionStorage.getItem("portfolio_loaded") === "true"
      ) {
        return false;
      }
    }
    return true;
  });
  const [loading, setLoading] = useState(0);

  const value = {
    isLoading,
    setIsLoading,
    setLoading,
  };

  useEffect(() => {
    const isSkipped =
      window.innerWidth <= 768 ||
      window.location.hash.includes("admin") ||
      sessionStorage.getItem("portfolio_loaded") === "true";

    // Auto-start animations if loading was skipped or already seen
    if (isSkipped) {
      import("../components/utils/initialFX").then((module) => {
        if (module.initialFX) {
          setTimeout(() => {
            module.initialFX();
          }, 60);
        }
      });
      return;
    }

    // Safety timeout: Maximum 2.8 seconds, then reveal website automatically
    const safetyTimer = setTimeout(() => {
      sessionStorage.setItem("portfolio_loaded", "true");
      import("../components/utils/initialFX").then((module) => {
        if (module.initialFX) {
          try {
            module.initialFX();
          } catch (e) {
            console.warn(e);
          }
        }
      });
      setIsLoading(false);
    }, 2800);

    // Smoothly progress loader to 100%
    const progress = setProgress((value) => setLoading(value));
    progress.loaded();

    return () => {
      clearTimeout(safetyTimer);
      progress.clear();
    };
  }, []);

  useEffect(() => {}, [loading]);

  return (
    <LoadingContext.Provider value={value as LoadingType}>
      {isLoading && <Loading percent={loading} />}
      <main className="main-body">{children}</main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
