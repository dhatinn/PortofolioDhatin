import { Link } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import "./styles/CallToAction.css";

const CallToAction = () => {
  const { config } = usePortfolio();
  return (
    <div className="cta-section">
      <div className="cta-buttons">
        <Link to="/play" className="cta-btn cta-btn-play" data-cursor="disable">
          Play With Me →
        </Link>
        
        <a 
          href={config.contact.linkedin || config.contact.whatsapp} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="cta-btn cta-btn-hire"
          data-cursor="disable"
        >
          Hire Me →
        </a>
      </div>
    </div>
  );
};

export default CallToAction;
