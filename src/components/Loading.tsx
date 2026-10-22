import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";

import Marquee from "react-fast-marquee";
import { config } from "../config";

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [stage, setStage] = useState<"counter" | "split" | "welcome" | "portfolio" | "exit">("counter");

  useEffect(() => {
    if (percent >= 100 && stage === "counter") {
      const t1 = setTimeout(() => {
        setLoaded(true);
        const t2 = setTimeout(() => {
          setClicked(true);
          // Stage 1: Line in center splits open
          const t3 = setTimeout(() => {
            setStage("split");
            // Stage 2: Crimson stage opens, WELCOME text appears
            const t4 = setTimeout(() => {
              setStage("welcome");
              // Stage 3: Background WELCOME dims, PortFOLIO. lockup emerges
              const t5 = setTimeout(() => {
                setStage("portfolio");
                // Stage 4: Hold luxury motion, then trigger exit into main site
                const t6 = setTimeout(() => {
                  handleExit();
                }, 1750);
                return () => clearTimeout(t6);
              }, 700);
              return () => clearTimeout(t5);
            }, 500);
            return () => clearTimeout(t4);
          }, 350);
          return () => clearTimeout(t3);
        }, 280);
        return () => clearTimeout(t2);
      }, 150);
      return () => clearTimeout(t1);
    }
  }, [percent, stage]);

  const handleExit = () => {
    if (stage === "exit") return;
    setStage("exit");
    import("./utils/initialFX").then((module) => {
      if (module.initialFX) {
        module.initialFX();
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
    });
  };

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className={`loading-header ${stage !== "counter" ? "loader-out" : ""}`}>
        <a href="/#" className="loader-title" data-cursor="disable">
          {config.developer.fullName.replace(/\s+/g, "")}
        </a>
        <div className={`loaderGame ${clicked && "loader-out"}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>
            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div>

      <div
        className={`loading-screen ${stage !== "counter" ? "screen-hidden" : ""}`}
        style={stage !== "counter" ? { opacity: 0, pointerEvents: "none" } : undefined}
      >
        <div className="loading-marquee">
          <Marquee>
            {[...config.developer.taglines, ...config.developer.taglines].map((t, i) => (
              <span key={i}>&nbsp; {t} &nbsp;</span>
            ))}
          </Marquee>
        </div>
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Slit Line Animation */}
      <div
        className={`loading-center-slit ${
          stage === "split" ? "slit-active" : stage !== "counter" ? "slit-expand" : ""
        }`}
      />

      {/* Split Curtain Doors */}
      <div className={stage !== "counter" && stage !== "split" ? "loading-curtain-open" : ""}>
        <div className="loading-curtain-door loading-curtain-left" />
        <div className="loading-curtain-door loading-curtain-right" />
      </div>

      {/* Crimson Welcome Stage & PortFOLIO. Motion */}
      {stage !== "counter" && (
        <div
          className={`welcome-stage ${stage === "exit" ? "stage-exit" : ""}`}
          onClick={handleExit}
          title="Click to skip into website"
        >
          <div className="welcome-vignette" />

          {/* Giant Embossed Background WELCOME */}
          <div
            className={`welcome-bg-text ${
              stage === "portfolio" || stage === "exit" ? "bg-dimmed" : ""
            }`}
          >
            WELCOME
          </div>

          {/* Foreground PortFOLIO. Lockup */}
          <div
            className={`portfolio-lockup ${
              stage === "portfolio" || stage === "exit" ? "lockup-visible" : ""
            }`}
          >
            <div className="portfolio-lockup-inner">
              <div className="script-port">Port</div>
              <div className="bold-folio">
                FOLIO<span className="red-dot">.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent: number = 0;

  let interval = setInterval(() => {
    percent += 8 + Math.round(Math.random() * 8);
    if (percent >= 100) {
      percent = 100;
      setLoading(100);
      clearInterval(interval);
    } else {
      setLoading(percent);
    }
  }, 40);

  function clear() {
    clearInterval(interval);
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      clearInterval(interval);
      interval = setInterval(() => {
        if (percent < 100) {
          percent += 10;
          if (percent > 100) percent = 100;
          setLoading(percent);
        } else {
          resolve(percent);
          clearInterval(interval);
        }
      }, 20);
    });
  }
  return { loaded, percent, clear };
};
