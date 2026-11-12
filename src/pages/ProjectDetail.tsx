import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import {
  FiArrowLeft,
  FiExternalLink,
  FiGithub,
  FiCalendar,
  FiLayers,
  FiCheckCircle,
  FiHome,
  FiChevronLeft,
  FiChevronRight,
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

  // Scroll to top on load or when slug changes & reset active slide
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveImageIndex(0);
  }, [slug]);

  const prevProject = currentIndex > 0 ? config.projects[currentIndex - 1] : null;
  const nextProject = currentIndex < config.projects.length - 1 ? config.projects[currentIndex + 1] : null;

  const hasMultipleImages = images.length > 1;
  const currentImageSrc = images[activeImageIndex] || images[0] || config.placeholderImage;

  const handlePrevImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNextImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation for slides
  useEffect(() => {
    if (!hasMultipleImages) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages, handlePrevImage, handleNextImage]);

  // Touch swipe support for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !hasMultipleImages) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    setTouchStartX(null);
  };

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
            Slideshow Showcase Section (Arrows kiri/kanan & Dots di tengah)
            ============================================================ */}
        <section className="project-detail-showcase">
          <div className="project-detail-showcase-glow" />

          {/* Slide Card Container */}
          <div
            className="project-detail-slide-card"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Blur background behind image so no aspect ratio is cut off */}
            <div
              className="project-detail-slide-blur-bg"
              style={{ backgroundImage: `url(${currentImageSrc})` }}
              aria-hidden="true"
            />

            {/* Main active photo */}
            <div className="project-detail-slide-img-box">
              <img
                key={activeImageIndex}
                src={currentImageSrc}
                alt={`${project.title} - ${activeImageIndex + 1}`}
                className="project-detail-slide-img"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = config.placeholderImage;
                }}
              />
            </div>

            {/* Category Badge top left */}
            <div className="project-detail-slide-badge">
              <span className="badge-cat">{project.category}</span>
            </div>

            {/* Counter Badge top right */}
            {hasMultipleImages && (
              <div className="project-detail-slide-counter">
                <span>{String(activeImageIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
              </div>
            )}

            {/* Arrow Navigation (Kiri & Kanan) */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  className="project-detail-slide-arrow prev"
                  onClick={handlePrevImage}
                  aria-label="Foto sebelumnya"
                  title="Foto sebelumnya (Panah Kiri)"
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  className="project-detail-slide-arrow next"
                  onClick={handleNextImage}
                  aria-label="Foto berikutnya"
                  title="Foto berikutnya (Panah Kanan)"
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            {/* Centered Dots Indicator (Dot di tengahnya) */}
            {hasMultipleImages && (
              <div className="project-detail-slide-dots-bar">
                <div className="project-detail-slide-dots">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`project-detail-slide-dot ${idx === activeImageIndex ? "active" : ""}`}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Pindah ke foto ${idx + 1}`}
                      title={`Foto ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Strip for quick jumping when multiple images */}
          {hasMultipleImages && (
            <div className="project-detail-thumbs-scroll">
              {images.map((imgSrc, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`project-detail-thumb-item ${idx === activeImageIndex ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(idx)}
                  title={`Foto ${idx + 1}`}
                >
                  <img src={imgSrc} alt={`${project.title} ${idx + 1}`} loading="lazy" />
                </button>
              ))}
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

