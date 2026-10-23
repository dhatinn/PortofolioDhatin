import "./styles/Landing.css";
import { usePortfolio } from "../context/PortfolioContext";
import { useLoading } from "../context/LoadingProvider";
import LanyardCanvas from "./Lanyard";
import SolarAuraStage from "./SolarAuraStage";

const Landing = () => {
  const { config } = usePortfolio();
  const { isLoading } = useLoading();

  const nameParts = (config.developer.fullName || "").split(" ");
  const firstName = nameParts[0] || config.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";
  const mainRole = config.developer.taglines[0] || "Full-Stack Developer";
  const subRoles = config.developer.taglines.slice(1);

  return (
    <>
      <div className="landing-section" id="landingDiv">
        {/* Luxury 3D Solar Aura Stage with 8 draggable floating tech badges & depth cutout */}
        <SolarAuraStage isPlaying={!isLoading} />

        <div className="landing-container">
          {/* Left Intro Card: Glassmorphism Card (No orange stroke) */}
          <div className="landing-intro">
            <div className="landing-intro-glass">
              <div className="landing-greeting-tag">
                <span className="landing-pulse-dot" />
                <span>HELLO, I'M</span>
              </div>
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

          {/* Right Info Card: Glassmorphism Card (No orange stroke) */}
          <div className="landing-info">
            <div className="landing-info-glass">
              <div className="landing-info-tag">
                <span>EXPERTISE & DISCIPLINE</span>
              </div>
              <h2 className="landing-info-h2">
                <span className="landing-h2-gradient">{mainRole.toUpperCase()}</span>
              </h2>
              {subRoles.length > 0 && (
                <div className="landing-sub-pills">
                  {subRoles.map((role, idx) => (
                    <span key={idx} className="landing-role-pill">
                      {role.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive 3D Lanyard ID Badge (shown in About Me & What I Do) */}
        <LanyardCanvas />
      </div>
    </>
  );
};

export default Landing;
