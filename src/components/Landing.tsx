import { useState, useEffect, useRef, useCallback } from "react";
import "./styles/Landing.css";
import { usePortfolio } from "../context/PortfolioContext";
import { useLoading } from "../context/LoadingProvider";
import SolarAuraStage from "./SolarAuraStage";

import TechText from "./TechText";

const Landing = () => {
  const { config, language } = usePortfolio();
  const { isLoading } = useLoading();

  const nameParts = (config.developer.fullName || "").split(" ");
  const firstName = nameParts[0] || config.developer.name;

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
          {/* Left Intro: Interactive TechText (Glassmorphism box and available badge removed) */}
          <div className="landing-intro">
            <TechText
              text={(firstName || "DHATIN").toUpperCase()}
              align="left"
              color="#ffffff"
              accentColor="#ff7a00"
              fontWeight={900}
              fontSize={140}
              letterSpacing={-0.02}
              softness={0.65}
              reach={220}
              dashLength={5}
              dashGap={3}
              strokeWidth={1.8}
              specks={16}
              bounce={0.45}
              draggable={true}
              clickKick={true}
              sweep={true}
              speed={1}
              labels={true}
              selection={true}
            />
          </div>

          {/* Right Info: Looping Animated Roles without glassmorphism box */}
          <div className="landing-info">
            {/* Looping Animated Role Heading with Staggered Kinetic Slide */}
            <h2
              className="landing-info-h2 interactive-role-heading"
              onClick={handleNextRole}
              title={
                language === "id"
                  ? "Klik untuk ganti profesi"
                  : "Click to switch role"
              }
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
    </>
  );
};

export default Landing;
