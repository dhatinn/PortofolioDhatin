import "./styles/About.css";
import { usePortfolio } from "../context/PortfolioContext";
import ScrollReveal from "./ScrollReveal";

const About = () => {
  const { config } = usePortfolio();
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">{config.about.title}</h3>
        <ScrollReveal
          as="p"
          formattedText={config.about.description}
          containerClassName="about-scroll-reveal"
          textClassName="about-scroll-text"
          enableBlur={true}
          blurStrength={5}
          baseOpacity={0.15}
          stagger={0.035}
          inStart="top 80%"
          inEnd="center 50%"
          enableOutAnimation={true}
          outStart="center 42%"
          outEnd="bottom 15%"
        />
      </div>
    </div>
  );
};

export default About;
