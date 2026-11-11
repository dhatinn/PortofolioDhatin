import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import TiltedCard, { TiltedCardLayer } from "../components/TiltedCard";
import {
  FiArrowLeft,
  FiExternalLink,
  FiGithub,
  FiCalendar,
  FiLayers,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
} from "react-icons/fi";
import "./ProjectDetail.css";

const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config, language } = usePortfolio();

  // Find project by slug or numeric ID
  const currentIndex = config.projects.findIndex(
    (p) =>
      p.slug.toLowerCase() === (slug || "").toLowerCase() ||
      String(p.id) === slug ||
      `project0${p.id}`.toLowerCase() === (slug || "").toLowerCase()
  );

  const project = currentIndex !== -1 ? config.projects[currentIndex] : null;

  // Multi-image list (at least 1 image)
  const images = project?.images && project.images.length > 0
    ? project.images
    : project?.image
    ? [project.image]
    : [config.placeholderImage];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Scroll to top on load or when slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveImageIndex(0);
  }, [slug]);

  if (!project) {
    return (
      <div className="project-detail-page">
        <div className="project-detail-container" style={{ textAlign: "center", paddingTop: "120px" }}>
          <h2 style={{ fontSize: "32px", color: "#fff", marginBottom: "16px" }}>
            {language === "id" ? "Proyek Tidak Ditemukan" : "Project Not Found"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "30px" }}>
            {language === "id"
              ? "Proyek dengan tautan ini tidak tersedia atau sudah dipindahkan."
              : "The project you are looking for does not exist or has been moved."}
          </p>
          <Link to="/projectportofolio" className="project-detail-back-pill" data-cursor="disable">
            <FiArrowLeft /> {language === "id" ? "Kembali ke Portofolio" : "Back to Portfolio"}
          </Link>
        </div>
      </div>
    );
  }

  const prevProject = currentIndex > 0 ? config.projects[currentIndex - 1] : null;
  const nextProject = currentIndex < config.projects.length - 1 ? config.projects[currentIndex + 1] : null;

  const currentImageSrc = images[activeImageIndex] || config.placeholderImage;
  const hasMultipleImages = images.length > 1;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const directDemoLink = project.demo || project.link;
  const directRepoLink = project.repo;

  return (
    <div className="project-detail-page">
      {/* Top Floating Navigation */}
      <nav className="project-detail-nav">
        <Link to="/projectportofolio" className="project-detail-back-pill" data-cursor="disable">
          <FiArrowLeft />
          <span>{language === "id" ? "Semua Proyek" : "All Projects"}</span>
        </Link>
        <Link to="/" className="project-detail-home-pill" data-cursor="disable">
          <FiHome />
          <span>{language === "id" ? "Beranda" : "Home"}</span>
        </Link>
      </nav>

      <div className="project-detail-container">
        {/* Header Section */}
        <header className="project-detail-header">
          <div className="project-detail-meta-badges">
            <span className="project-detail-badge-cat">{project.category}</span>
            {project.year && (
              <span className="project-detail-badge-year">
                <FiCalendar style={{ marginRight: 4, verticalAlign: "middle" }} />
                {project.year}
              </span>
            )}
          </div>
          <h1 className="project-detail-title">{project.title}</h1>
          {project.description && (
            <p className="project-detail-subtitle">{project.description}</p>
          )}
        </header>

        {/* ============================================================
            TiltedCard 3D Showcase (Multi-Image Support)
            ============================================================ */}
        <section className="project-detail-showcase">
          <div className="project-detail-showcase-glow" />

          <div className="project-detail-card-wrapper">
            <TiltedCard
              imageSrc={currentImageSrc}
              altText={project.title}
              captionText={project.title}
              containerHeight="440px"
              containerWidth="100%"
              imageHeight="440px"
              imageWidth="100%"
              objectFit="contain"
              blurBackground
              rotateAmplitude={18}
              scaleOnHover={1.03}
              glare={0.4}
              shadow={0.55}
              backContent={
                <div className="project-detail-backcontent">
                  <h4>{project.title}</h4>
                  <p>{project.description || "Detail karya portofolio."}</p>
                  {project.technologies && (
                    <div className="project-detail-backcontent-tech">
                      {project.technologies}
                    </div>
                  )}
                  <span className="project-detail-flip-hint">
                    {language === "id" ? "✦ Klik lagi untuk membalik ke foto" : "✦ Click again to flip back to photo"}
                  </span>
                </div>
              }
            >
              <TiltedCardLayer depth={30}>
                <div className="project-detail-floating-badge">
                  <span className="badge-cat">{project.category}</span>
                </div>
              </TiltedCardLayer>
            </TiltedCard>
          </div>

          {/* Multi-Image Controls / Selector if project has > 1 image */}
          {hasMultipleImages && (
            <div className="project-detail-slide-controls">
              <div className="project-detail-thumbs-row">
                {images.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`project-detail-thumb-btn ${idx === activeImageIndex ? "active" : ""}`}
                    onClick={() => setActiveImageIndex(idx)}
                    title={`Lihat foto ${idx + 1}`}
                  >
                    <img src={imgSrc} alt={`${project.title} ${idx + 1}`} />
                  </button>
                ))}
              </div>

              <div className="project-detail-nav-buttons">
                <button
                  type="button"
                  className="project-detail-arrow-btn"
                  onClick={handlePrevImage}
                  aria-label="Foto sebelumnya"
                >
                  <FiChevronLeft />
                </button>
                <span className="project-detail-counter">
                  {activeImageIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  className="project-detail-arrow-btn"
                  onClick={handleNextImage}
                  aria-label="Foto berikutnya"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              Direct Project Links (Right below the showcase element)
              ============================================================ */}
          <div className="project-detail-actions">
            {directDemoLink ? (
              <a
                href={directDemoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="project-direct-btn primary"
                data-cursor="disable"
              >
                <FiExternalLink />
                <span>
                  {language === "id" ? "Buka Proyek / Live Demo" : "View Live Project"}
                </span>
              </a>
            ) : null}

            {directRepoLink ? (
              <a
                href={directRepoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="project-direct-btn secondary"
                data-cursor="disable"
              >
                <FiGithub />
                <span>
                  {language === "id" ? "Source Code di GitHub" : "View on GitHub"}
                </span>
              </a>
            ) : null}

            {!directDemoLink && !directRepoLink && (
              <div className="project-no-link-badge">
                <FiCheckCircle style={{ marginRight: 6, verticalAlign: "middle" }} />
                <span>
                  {language === "id"
                    ? "Proyek internal / Tidak memerlukan tautan eksternal"
                    : "Internal / Private project"}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Detailed Info Grid */}
        <div className="project-detail-body">
          <main className="project-detail-main-info">
            <h3 className="project-detail-section-title">
              <span>✦</span> {language === "id" ? "Tentang Proyek" : "About the Project"}
            </h3>
            <p className="project-detail-description">
              {project.description || (language === "id" ? "Belum ada deskripsi lengkap." : "No description provided.")}
            </p>

            {/* Case Study Details if filled */}
            {project.caseStudy && (
              <>
                <h3 className="project-detail-section-title" style={{ marginTop: "32px" }}>
                  <span>✦</span> {language === "id" ? "Studi Kasus & Dampak" : "Case Study & Impact"}
                </h3>
                <div className="project-detail-casestudy-grid">
                  {project.caseStudy.problem && (
                    <div className="project-detail-casestudy-card">
                      <h5>{language === "id" ? "Tantangan / Masalah" : "The Challenge"}</h5>
                      <p>{project.caseStudy.problem}</p>
                    </div>
                  )}
                  {project.caseStudy.solution && (
                    <div className="project-detail-casestudy-card">
                      <h5>{language === "id" ? "Solusi & Inovasi" : "The Solution"}</h5>
                      <p>{project.caseStudy.solution}</p>
                    </div>
                  )}
                  {project.caseStudy.role && (
                    <div className="project-detail-casestudy-card">
                      <h5>{language === "id" ? "Peran" : "Role"}</h5>
                      <p>{project.caseStudy.role}</p>
                    </div>
                  )}
                  {project.caseStudy.impact && (
                    <div className="project-detail-casestudy-card">
                      <h5>{language === "id" ? "Dampak / Hasil" : "Impact & Result"}</h5>
                      <p>{project.caseStudy.impact}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          <aside className="project-detail-sidebar">
            <div className="project-detail-sidebar-card">
              <h4>
                <FiLayers style={{ marginRight: 8, verticalAlign: "middle", color: "#ff7a00" }} />
                {language === "id" ? "Teknologi & Fitur" : "Tech Stack & Tools"}
              </h4>
              <div className="project-detail-tech-chips">
                {(project.stack && project.stack.length > 0
                  ? project.stack
                  : (project.technologies || "").split(",").map((s) => s.trim()).filter(Boolean)
                ).map((tech, i) => (
                  <span key={i} className="project-detail-tech-chip">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="project-detail-sidebar-card">
              <h4>{language === "id" ? "Informasi Singkat" : "Quick Info"}</h4>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 8px" }}>
                <strong>{language === "id" ? "Kategori:" : "Category:"}</strong> {project.category}
              </p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 8px" }}>
                <strong>{language === "id" ? "Tahun:" : "Year:"}</strong> {project.year}
              </p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: 0 }}>
                <strong>{language === "id" ? "Total Foto:" : "Total Photos:"}</strong> {images.length} {language === "id" ? "foto" : "images"}
              </p>
            </div>
          </aside>
        </div>

        {/* Prev / Next Pagination */}
        <div className="project-detail-pagination">
          {prevProject ? (
            <Link
              to={`/projectportofolio/${prevProject.slug}`}
              className="project-pagination-link prev"
              data-cursor="disable"
            >
              <span className="project-pagination-label">
                ← {language === "id" ? "Proyek Sebelumnya" : "Previous Project"}
              </span>
              <span className="project-pagination-title">{prevProject.title}</span>
            </Link>
          ) : <div />}

          {nextProject ? (
            <Link
              to={`/projectportofolio/${nextProject.slug}`}
              className="project-pagination-link next"
              data-cursor="disable"
            >
              <span className="project-pagination-label">
                {language === "id" ? "Proyek Selanjutnya" : "Next Project"} →
              </span>
              <span className="project-pagination-title">{nextProject.title}</span>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

