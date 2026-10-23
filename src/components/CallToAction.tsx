import { useNavigate } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import SpecularButton from "./SpecularButton";
import "./styles/CallToAction.css";

const CallToAction = () => {
  const { config } = usePortfolio();
  const navigate = useNavigate();

  return (
    <div className="cta-section">
      <div className="cta-buttons">
        <SpecularButton
          size="lg"
          radius={18}
          tint="#ffffff"
          tintOpacity={0.05}
          textColor="#f5f5f5"
          lineColor="#ffffff"
          baseColor="#525252"
          intensity={1.1}
          idleIntensity={0.35}
          thickness={1.2}
          glow={1.0}
          onClick={() => navigate("/play")}
          data-cursor="disable"
        >
          Play With Me &rarr;
        </SpecularButton>
        
        <SpecularButton
          size="lg"
          radius={18}
          tint="#facc15"
          tintOpacity={0.16}
          textColor="#facc15"
          lineColor="#fff59d"
          baseColor="#d97706"
          intensity={1.3}
          idleIntensity={0.45}
          thickness={1.3}
          glow={1.2}
          style={{
            fontWeight: 600,
            boxShadow: "0 0 25px -4px rgba(250, 204, 21, 0.25), 0 10px 24px -14px rgba(0, 0, 0, 0.45)"
          }}
          onClick={() => {
            const target = config.contact.linkedin || `mailto:${config.contact.email}` || "#contact";
            window.open(target, "_blank", "noopener,noreferrer");
          }}
          data-cursor="disable"
        >
          Hire Me &rarr;
        </SpecularButton>
      </div>
    </div>
  );
};

export default CallToAction;
