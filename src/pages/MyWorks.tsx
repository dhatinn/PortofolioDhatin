import { Link } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import "./MyWorks.css";

const MyWorks = () => {
  const { config } = usePortfolio();
  const designProjects = config.projects.filter((project) =>
    /design|ui\/?ux|graphic|video|edit|motion|illustrat|photo|multimedia/i.test(project.category)
  );
  const codingProjects = config.projects.filter((project) => !designProjects.includes(project));

  const renderProjects = (projects: typeof config.projects) => (
    <div className="myworks-grid">
      {projects.map((project, index) => {
        const isInternalLink = Boolean(project.link?.startsWith("/"));
        const cardContent = (
          <>
            <div className="myworks-card-number">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="myworks-card-image">
              <img
                src={project.image}
                alt={project.title}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = config.placeholderImage;
                }}
              />
            </div>
            <div className="myworks-card-info">
              <h3>{project.title}</h3>
              <p className="myworks-card-category">{project.category}</p>
              <p className="myworks-card-description">{project.description}</p>
              <p className="myworks-card-tech">{project.technologies}</p>
            </div>
          </>
        );

        if (isInternalLink) {
          return (
            <Link
              className="myworks-card"
              key={project.id}
              data-cursor="disable"
              to={project.link}
            >
              {cardContent}
            </Link>
          );
        }

        return (
          <a
            className="myworks-card"
            key={project.id}
            data-cursor="disable"
            href={project.link || undefined}
            target={project.link ? "_blank" : undefined}
            rel={project.link ? "noopener noreferrer" : undefined}
          >
            {cardContent}
          </a>
        );
      })}
    </div>
  );

  return (
    <div className="myworks-page">
      <div className="myworks-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Back to Home
        </Link>
        <h1>
          All <span>Works</span>
        </h1>
        <p>A collection of all my projects and creations</p>
      </div>

      <section className="myworks-group">
        <div className="myworks-group-heading">
          <div>
            <span>01 / DEVELOPMENT</span>
            <h2>Coding &amp; Development</h2>
          </div>
          <p>Websites, applications, and software projects.</p>
        </div>
        {codingProjects.length > 0
          ? renderProjects(codingProjects)
          : <p className="myworks-empty">Belum ada proyek coding.</p>}
      </section>

      <section className="myworks-group">
        <div className="myworks-group-heading">
          <div>
            <span>02 / CREATIVE</span>
            <h2>Design &amp; Editing</h2>
          </div>
          <p>Visual design, UI/UX, graphics, and video editing.</p>
        </div>
        {designProjects.length > 0
          ? renderProjects(designProjects)
          : <p className="myworks-empty">Belum ada karya design atau editing.</p>}
      </section>
    </div>
  );
};

export default MyWorks;
