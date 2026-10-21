import "./styles/Career.css";
import { usePortfolio } from "../context/PortfolioContext";

const getDisplayYear = (period: string) => {
  if (/present|sekarang/i.test(period)) return "NOW";
  const years = period.match(/\d{4}/g);
  return years ? years[0] : period; // Show start year for ranges
};

const Career = () => {
  const { config } = usePortfolio();
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          {config.experiences.map((exp, index) => (
            <div key={index} className="career-info-box">
              <div className="career-info-in">
                <div className="career-role">
                  <h4>{exp.position}</h4>
                  <h5>{exp.company}</h5>
                  <h6 className="career-period">{exp.period}</h6>
                </div>
                <h3>{getDisplayYear(exp.period)}</h3>
              </div>
              <ul className="career-points">
                {exp.responsibilities.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Career;
