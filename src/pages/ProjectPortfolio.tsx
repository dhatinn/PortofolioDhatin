import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import PillNav from "../components/PillNav/PillNav";
import CircularCarousel, { CircularCarouselItem } from "../components/CircularCarousel";
import SplitText from "../components/SplitText";
import logo from "../assets/logo.svg";
import { FiCode, FiVideo, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import "./ProjectPortfolio.css";

const ProjectPortfolio: React.FC = () => {
  const { config, language } = usePortfolio();
  const [activeTab, setActiveTab] = useState<"all" | "developer" | "multimedia">("all");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const multimediaProjects = config.projects.filter((project) =>
    /design|ui\/?ux|graphic|video|edit|motion|illustrat|photo|multimedia|creative/i.test(
      project.category
    )
  );

  const developerProjects = config.projects.filter(
    (project) => !multimediaProjects.includes(project)
  );

  // Extract all images and captions from projects for CircularCarousel
  const carouselItems: CircularCarouselItem[] = config.projects.flatMap((project) => {
    const list = project.images && project.images.length > 0 ? project.images : [project.image];
    return list
      .filter((imgSrc) => imgSrc && imgSrc !== config.placeholderImage)
      .map((imgSrc, imgIdx) => ({
        src: imgSrc,
        alt: project.title,
        title: project.title,
        subtitle: `${project.category}${list.length > 1 ? ` • ${imgIdx + 1}/${list.length}` : ""}`,
      }));
  });

  const navItems = [
    { label: language === "id" ? "Beranda" : "Home", href: "/" },
    { label: language === "id" ? "Semua" : "All", href: "#all" },
    { label: "Developer", href: "#developer" },
    { label: "Multimedia", href: "#multimedia" },
  ];

  const handleNavClick = (
    item: { label: string; href?: string },
    _index: number,
    event: React.MouseEvent<HTMLElement>
  ) => {
    if (item.href === "/") {
      return; // standard navigation to home
    }

    event.preventDefault();
    if (item.href === "#all") {
      setActiveTab("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (item.href === "#developer") {
      setActiveTab("developer");
      const el = document.getElementById("developer-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (item.href === "#multimedia") {
      setActiveTab("multimedia");
      const el = document.getElementById("multimedia-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAnimationComplete = () => {
    console.log("All letters have animated!");
  };

  const renderProjectCard = (project: typeof config.projects[0], index: number) => {
    const CardInner = (
      <>
        <div className="portfolio-card-number">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="portfolio-card-thumb">
          <div
            className="portfolio-card-blur-bg"
            style={{ backgroundImage: `url(${project.image})` }}
            aria-hidden="true"
          />
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
          <div className="portfolio-card-overlay">
            <span className="portfolio-card-view-btn">
              {language === "id" ? "Buka Detail" : "View Details"} <FiArrowRight />
            </span>
          </div>
        </div>
        <div className="portfolio-card-content">
          <div className="portfolio-card-meta">
            <span className="portfolio-card-badge">{project.category}</span>
            {project.year && (
              <span className="portfolio-card-year">{project.year}</span>
            )}
          </div>
          <h3 className="portfolio-card-title">{project.title}</h3>
          <p className="portfolio-card-desc">{project.description}</p>
          {project.technologies && (
            <div className="portfolio-card-tech">
              <span>{project.technologies}</span>
            </div>
          )}
        </div>
      </>
    );

    const detailUrl = `/projectportofolio/${project.slug || `project0${index + 1}`}`;

    return (
      <Link
        key={project.id ?? index}
        to={detailUrl}
        className="portfolio-card"
        data-cursor="disable"
      >
        {CardInner}
      </Link>
    );
  };

  return (
    <div className="project-portfolio-page">
      {/* Sticky PillNav Header (Responsive on Desktop & Mobile) */}
      <header className="portfolio-nav-header">
        <PillNav
          logo={logo}
          logoAlt="Dhatin Nuril Arsandy"
          logoHref="/"
          items={navItems}
          activeHref={
            activeTab === "all"
              ? "#all"
              : activeTab === "developer"
              ? "#developer"
              : "#multimedia"
          }
          itemStyle="pill"
          hoverEffect="fill"
          indicator="dot"
          onItemClick={handleNavClick}
        />
      </header>

      {/* Hero Header */}
      <section className="portfolio-hero" id="all">
        <div className="portfolio-hero-container">
          <h1 className="portfolio-hero-title">
            <SplitText
              text={language === "id" ? "Koleksi" : "Curated"}
              className="portfolio-hero-title-main"
              tag="span"
              effect="blur"
              splitType="chars"
              delay={45}
              duration={1.4}
              staggerFrom="start"
              trigger="click"
              hoverEffect="wave"
              loop={false}
              loopDelay={1.5}
              mask={false}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
            />
            <SplitText
              text={language === "id" ? "Portofolio" : "Portfolio"}
              className="portfolio-hero-title-accent"
              color="#ff7a00"
              tag="span"
              effect="blur"
              splitType="chars"
              delay={45}
              duration={1.4}
              staggerFrom="start"
              trigger="click"
              hoverEffect="wave"
              loop={false}
              loopDelay={1.5}
              mask={false}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
            />
          </h1>
          <p className="portfolio-hero-subtitle">
            {language === "id"
              ? "Jelajahi seluruh karya pilihan saya yang terbagi dalam bidang Web & Software Development serta Multimedia & Creative."
              : "Explore all of my featured works categorized into Web & Software Development and Multimedia & Creative Design."}
          </p>
        </div>

        {/* Circular Carousel Showcase */}
        {carouselItems.length > 0 && (
          <div style={{ width: '100%', height: '560px', position: 'relative', marginTop: '10px' }}>
            <CircularCarousel
              items={carouselItems}
              preset="panorama"
              intro="rise"
              cardWidth={220}
              aspectRatio={1}
              speed={14}
              captions
              tilt={0}
              perspective={1800}
              autoplay="step"
              momentum={0.86}
              snap={false}
              focusOnClick={false}
              parallax={0.22}
              stretch={0.27}
              depthFade={1}
            />
          </div>
        )}
      </section>

      {/* Main Content Sections */}
      <main className="portfolio-content-container">
        {/* SECTION 1: DEVELOPER */}
        {(activeTab === "all" || activeTab === "developer") && (
          <section className="portfolio-section" id="developer-section">
            <div className="portfolio-section-header">
              <div className="portfolio-section-badge">
                <FiCode /> 01 / DEVELOPER
              </div>
              <h2 className="portfolio-section-heading">
                Web &amp; Software Development
              </h2>
              <p className="portfolio-section-desc">
                {language === "id"
                  ? "Aplikasi web responsif, frontend interaktif, REST API backend, dan integrasi cloud/database modern."
                  : "Responsive web apps, interactive frontends, backend REST APIs, and modern cloud/database systems."}
              </p>
            </div>

            {developerProjects.length > 0 ? (
              <div className="portfolio-grid">
                {developerProjects.map((p, idx) => renderProjectCard(p, idx))}
              </div>
            ) : (
              <div className="portfolio-empty">
                <p>
                  {language === "id"
                    ? "Belum ada proyek coding yang ditambahkan."
                    : "No developer projects added yet."}
                </p>
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: MULTIMEDIA */}
        {(activeTab === "all" || activeTab === "multimedia") && (
          <section className="portfolio-section" id="multimedia-section">
            <div className="portfolio-section-header">
              <div className="portfolio-section-badge">
                <FiVideo /> 02 / MULTIMEDIA
              </div>
              <h2 className="portfolio-section-heading">
                Design &amp; Video Editing
              </h2>
              <p className="portfolio-section-desc">
                {language === "id"
                  ? "Desain visual grafis, UI/UX antarmuka, poster, video editing sinematik komersial, & motion artwork."
                  : "Graphic design, UI/UX interfaces, posters, commercial cinematic video editing, & motion artwork."}
              </p>
            </div>

            {multimediaProjects.length > 0 ? (
              <div className="portfolio-grid">
                {multimediaProjects.map((p, idx) => renderProjectCard(p, idx))}
              </div>
            ) : (
              <div className="portfolio-empty">
                <p>
                  {language === "id"
                    ? "Belum ada karya multimedia yang ditambahkan."
                    : "No multimedia projects added yet."}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Bottom Back Button */}
        <div className="portfolio-bottom-action">
          <Link to="/" className="portfolio-back-home-btn" data-cursor="disable">
            <FiArrowLeft />
            <span>{language === "id" ? "Kembali ke Beranda Portofolio" : "Back to Home Portfolio"}</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ProjectPortfolio;

