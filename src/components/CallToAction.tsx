import { useNavigate } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import SpecularButton from "./SpecularButton";
import BlurText from "./BlurText";
import "./styles/CallToAction.css";

const CallToAction = () => {
  const { config, language } = usePortfolio();
  const navigate = useNavigate();

  const isId = language === "id";

  const questionText = isId
    ? "Tertarik untuk bekerja sama mewujudkan ide proyek Anda?"
    : "Interested in working together to bring your project to life?";

  const subtitleText = isId
    ? "Mari diskusikan ide Anda — mulai dari website responsif, aplikasi web modern, hingga identitas visual yang memukau."
    : "Let's collaborate — from responsive web apps to high performance digital & visual experiences.";

  return (
    <section className="cta-section" id="collaboration">
      <div className="cta-container">
        <div className="cta-badge">✦ {isId ? "KOLABORASI & KARIER" : "LET'S COLLABORATE"}</div>

        <BlurText
          key={questionText}
          text={questionText}
          delay={90}
          animateBy="words"
          direction="top"
          className="cta-blur-title"
          effect="blur"
          blur={12}
        />

        <p className="cta-subtitle">{subtitleText}</p>

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
              boxShadow:
                "0 0 25px -4px rgba(250, 204, 21, 0.25), 0 10px 24px -14px rgba(0, 0, 0, 0.45)",
            }}
            onClick={() => {
              const target =
                config.contact.linkedin ||
                `mailto:${config.contact.email}` ||
                "#contact";
              window.open(target, "_blank", "noopener,noreferrer");
            }}
            data-cursor="disable"
          >
            Hire Me &rarr;
          </SpecularButton>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
