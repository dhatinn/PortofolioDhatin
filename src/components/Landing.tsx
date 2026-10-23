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

  return (
    <>
      <div className="landing-section" id="landingDiv">
        {/* Luxury 3D Solar Aura Stage with 8 draggable floating tech badges & depth cutout */}
        <SolarAuraStage isPlaying={!isLoading} />

        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              {firstName.toUpperCase()}{" "}
              <br />
              {lastName && <span>{lastName.toUpperCase()}</span>}
            </h1>
          </div>
          <div className="landing-info">
            <h3>A</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">{config.developer.taglines[0]}</div>
            </h2>
            <h2 className="landing-info-sub">
              <div className="landing-h2-info">
                {config.developer.taglines.slice(1).join(" & ")}
              </div>
            </h2>
          </div>
        </div>

        {/* Interactive 3D Lanyard ID Badge (shown in About Me & What I Do) */}
        <LanyardCanvas />
      </div>
    </>
  );
};

export default Landing;
