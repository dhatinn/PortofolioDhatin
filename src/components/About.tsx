import "./styles/About.css";
import { usePortfolio } from "../context/PortfolioContext";

function renderFormattedAbout(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="about-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

const About = () => {
  const { config } = usePortfolio();
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">{config.about.title}</h3>
        <p className="para">
          {renderFormattedAbout(config.about.description)}
        </p>
      </div>
    </div>
  );
};

export default About;
