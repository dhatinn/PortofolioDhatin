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
          radius={12}
          tint="#ffffff"
          tintOpacity={0.06}
          textColor="#ffffff"
          lineColor="#ffffff"
          baseColor="#404040"
          intensity={1.2}
          idleIntensity={0.35}
          thickness={1.3}
          glow={1.0}
          onClick={() => navigate("/play")}
          data-cursor="disable"
        >
          Play With Me &rarr;
        </SpecularButton>
        
        <SpecularButton
          size="lg"
          radius={12}
          tint="#ff8c00"
          tintOpacity={0.96}
          textColor="#000000"
          lineColor="#ffffff"
          baseColor="#d97706"
          intensity={1.4}
          idleIntensity={0.45}
          thickness={1.4}
          glow={1.2}
          style={{ fontWeight: 600 }}
          onClick={() => {
            const target = config.contact.linkedin || config.contact.whatsapp || "#contact";
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
