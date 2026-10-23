import { useState, useEffect, useRef, useCallback } from "react";
import "./styles/Landing.css";
import { usePortfolio } from "../context/PortfolioContext";
import { useLoading } from "../context/LoadingProvider";
import SolarAuraStage from "./SolarAuraStage";

const Landing = () => {
  const { config } = usePortfolio();
  const { isLoading } = useLoading();

  const nameParts = (config.developer.fullName || "").split(" ");
  const firstName = nameParts[0] || config.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";

  const taglines =
    config.developer.taglines && config.developer.taglines.length > 0
      ? config.developer.taglines
      : ["Full-Stack Developer", "Graphic Designer", "Video Editor"];

  const [roleIndex, setRoleIndex] = useState(0);
  const [animState, setAnimState] = useState<"idle" | "exit" | "enter">("idle");
  const roleIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    roleIndexRef.current = roleIndex;
  }, [roleIndex]);

  const triggerTransition = useCallback((nextIdx: number) => {
    setAnimState("exit");
    setTimeout(() => {
      setRoleIndex(nextIdx);
      roleIndexRef.current = nextIdx;
      setAnimState("enter");
      // Double rAF ensures the enter transform is painted before transitioning to idle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState("idle");
        });
      });
    }, 280);
  }, []);

  const startLoopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const next = (roleIndexRef.current + 1) % taglines.length;
      triggerTransition(next);
    }, 3800);
  }, [taglines.length, triggerTransition]);

  useEffect(() => {
    startLoopTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startLoopTimer]);

  const handleNextRole = () => {
    const next = (roleIndexRef.current + 1) % taglines.length;
    triggerTransition(next);
    startLoopTimer();
  };

  const currentRole = taglines[roleIndex] || "Full-Stack Developer";
  const roleWords = currentRole.split(" ");
  const line1 = roleWords[0] || currentRole;
  const line2 = roleWords.slice(1).join(" ");

  return (
    <>
      <div className="landing-section" id="landingDiv">
        {/* Luxury 3D Solar Aura Stage with 8 draggable floating tech badges & depth cutout */}
        <SolarAuraStage isPlaying={!isLoading} />

        <div className="landing-container">
          {/* Left Intro Card: Glassmorphism Card (No orange stroke) */}
          <div className="landing-intro">
            <div className="landing-intro-glass">
              <h1 className="landing-name">
                <span className="landing-name-first">{firstName.toUpperCase()}</span>
                {lastName && (
                  <span className="landing-name-last">{lastName.toUpperCase()}</span>
                )}
              </h1>
              <div className="landing-status-badge">
                <span className="landing-status-dot" />
                <span>Available for Projects</span>
              </div>
            </div>
          </div>

          {/* Right Info Card: Glassmorphism Card with Looping Animated Roles */}
          <div className="landing-info">
            <div className="landing-info-glass">
              {/* Looping Animated Role Heading with Staggered Kinetic Slide */}
              <h2
                className="landing-info-h2 interactive-role-heading"
                onClick={handleNextRole}
                title="Klik untuk ganti profesi"
              >
                <div className={`landing-h2-anim-wrap anim-${animState}`}>
                  <span className="landing-h2-line line-1">
                    <span className="landing-h2-gradient">{line1.toUpperCase()}</span>
                  </span>
                  {line2 && (
                    <span className="landing-h2-line line-2">
                      <span className="landing-h2-gradient">{line2.toUpperCase()}</span>
                    </span>
                  )}
                </div>
              </h2>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landing;
