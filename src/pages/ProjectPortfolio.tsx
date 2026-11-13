import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";
import PillNav from "../components/PillNav/PillNav";
import ShowcaseCarousel, { ShowcaseItem } from "../components/ShowcaseCarousel";
import SplitText from "../components/SplitText";
import PulseHeart from "../components/PulseHeart";
import { getProjectLikes, isProjectLiked, toggleProjectLike } from "../utils/likesManager";
import logo from "../assets/logo.svg";
import {
  FiCode,
  FiVideo,
  FiArrowLeft,
  FiArrowRight,
  FiHeart,
  FiCalendar,
  FiClock,
  FiList,
  FiShuffle,
  FiSliders,
} from "react-icons/fi";
import "./ProjectPortfolio.css";

type SortMode = "likes" | "year-desc" | "year-asc" | "original" | "random";

const ProjectPortfolio: React.FC = () => {
  const { config, language } = usePortfolio();
  const [activeTab, setActiveTab] = useState<"all" | "developer" | "multimedia">("all");
  // Default sort is by number of likes as requested ("dari jumlah like (buat jadi defult)")
  const [sortBy, setSortBy] = useState<SortMode>("likes");
  const [randomSeed, setRandomSeed] = useState<number>(() => Date.now());
  const [, setLikesTick] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen to like change events across the application
  useEffect(() => {
    const handleLikeChanged = () => {
      setLikesTick((t) => t + 1);
    };
    window.addEventListener("portfolio_like_changed", handleLikeChanged);
    return () => window.removeEventListener("portfolio_like_changed", handleLikeChanged);
  }, []);

  const multimediaProjects = config.projects.filter((project) =>
    /design|ui\/?ux|graphic|video|edit|motion|illustrat|photo|multimedia|creative/i.test(
      project.category
    )
  );

  const developerProjects = config.projects.filter(
    (project) => !multimediaProjects.includes(project)
  );

  // Sorting function covering: likes (default), year newest, year oldest, original admin input, random
  const sortProjectList = (list: typeof config.projects) => {
    const cloned = [...list];
    if (sortBy === "original") {
      return cloned;
    }
    if (sortBy === "likes") {
      return cloned.sort((a, b) => {
        const keyA = a.slug || String(a.id);
        const keyB = b.slug || String(b.id);
        const likesA = getProjectLikes(keyA, a.likes);
        const likesB = getProjectLikes(keyB, b.likes);
        return likesB - likesA;
      });
    }
    if (sortBy === "year-desc") {
      return cloned.sort((a, b) => {
        const yA = parseInt(String(a.year || "0").replace(/\D/g, ""), 10) || 0;
        const yB = parseInt(String(b.year || "0").replace(/\D/g, ""), 10) || 0;
        return yB - yA;
      });
    }
    if (sortBy === "year-asc") {
      return cloned.sort((a, b) => {
        const yA = parseInt(String(a.year || "9999").replace(/\D/g, ""), 10) || 9999;
        const yB = parseInt(String(b.year || "9999").replace(/\D/g, ""), 10) || 9999;
        return yA - yB;
      });
    }
    if (sortBy === "random") {
      return cloned
        .map((item) => {
          const str = `${item.slug || item.id}_${randomSeed}`;
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
          }
          return { item, sortVal: Math.abs(hash) };
        })
        .sort((a, b) => a.sortVal - b.sortVal)
        .map((w) => w.item);
    }
    return cloned;
  };

  const sortedDeveloperProjects = sortProjectList(developerProjects);
  const sortedMultimediaProjects = sortProjectList(multimediaProjects);

  // Extract all projects and images for 3-card Highlight ShowcaseCarousel
  const showcaseItems: ShowcaseItem[] = config.projects.flatMap((project) => {
    const list = project.images && project.images.length > 0 ? project.images : [project.image];
    return list
      .filter((imgSrc) => imgSrc && imgSrc !== config.placeholderImage)
      .map((imgSrc, imgIdx) => ({
        id: project.id,
        slug: project.slug,
        src: imgSrc,
        alt: project.title,
        title: project.title,
        subtitle: `${project.category}${list.length > 1 ? ` • ${imgIdx + 1}/${list.length}` : ""}`,
        category: project.category,
        year: project.year,
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
    const projectKey = project.slug || String(project.id ?? index);
    const isLiked = isProjectLiked(projectKey);
    const likesCount = getProjectLikes(projectKey, project.likes);

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
            <div
              className="portfolio-card-like-pill"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title={language === "id" ? "Sukai karya ini" : "Like this project"}
            >
              <PulseHeart
                liked={isLiked}
                count={likesCount}
                onChange={() => {
                  toggleProjectLike(projectKey, likesCount);
                }}
                showCount
                icon="heart"
                idleOutline
                size={30}
                corner={20}
                likedColor="#ff4d6d"
                idleColor="#8b8b93"
                pillColor="#18181b"
                textColor="#f5f5f5"
                duration={560}
                dotSize={0.3}
                overshoot={1.7}
                beat={3}
                rollDuration={350}
              />
            </div>
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

        {/* 3-Card Spotlight Showcase Carousel */}
        {showcaseItems.length > 0 && (
          <ShowcaseCarousel
            items={showcaseItems}
            placeholderImage={config.placeholderImage}
            language={language}
          />
        )}
      </section>

      {/* Main Content Sections */}
      <main className="portfolio-content-container">
        {/* Sort Toolbar */}
        <div className="portfolio-sort-toolbar-container">
          <div className="portfolio-sort-topline">
            <div className="portfolio-sort-label">
              <FiSliders />
              <span>{language === "id" ? "Urutkan Portofolio:" : "Sort Projects:"}</span>
            </div>
            {sortBy === "random" && (
              <button
                type="button"
                className="portfolio-reshuffle-btn"
                onClick={() => setRandomSeed(Date.now())}
                title={language === "id" ? "Acak ulang susunan karya" : "Reshuffle projects"}
              >
                <FiShuffle />
                <span>{language === "id" ? "Acak Lagi" : "Reshuffle"}</span>
              </button>
            )}
          </div>

          <div className="portfolio-sort-pills">
            <button
              type="button"
              className={`portfolio-sort-pill ${sortBy === "likes" ? "active" : ""}`}
              onClick={() => setSortBy("likes")}
              title={language === "id" ? "Urutkan dari jumlah like terbanyak (Default)" : "Sort by most likes (Default)"}
            >
              <FiHeart className="sort-icon-heart" />
              <span>{language === "id" ? "Paling Disukai" : "Most Liked"}</span>
              <span className="sort-badge-default">{language === "id" ? "Default" : "Default"}</span>
            </button>

            <button
              type="button"
              className={`portfolio-sort-pill ${sortBy === "year-desc" ? "active" : ""}`}
              onClick={() => setSortBy("year-desc")}
              title={language === "id" ? "Urutkan dari tahun pembuatan terbaru" : "Sort by newest year"}
            >
              <FiCalendar />
              <span>{language === "id" ? "Tahun Terbaru" : "Newest Year"}</span>
            </button>

            <button
              type="button"
              className={`portfolio-sort-pill ${sortBy === "year-asc" ? "active" : ""}`}
              onClick={() => setSortBy("year-asc")}
              title={language === "id" ? "Urutkan dari tahun pembuatan terlama" : "Sort by oldest year"}
            >
              <FiClock />
              <span>{language === "id" ? "Tahun Terlama" : "Oldest Year"}</span>
            </button>

            <button
              type="button"
              className={`portfolio-sort-pill ${sortBy === "original" ? "active" : ""}`}
              onClick={() => setSortBy("original")}
              title={language === "id" ? "Urutkan sesuai susunan awal input" : "Sort by original order"}
            >
              <FiList />
              <span>{language === "id" ? "Urutan Asli" : "Original"}</span>
            </button>

            <button
              type="button"
              className={`portfolio-sort-pill ${sortBy === "random" ? "active" : ""}`}
              onClick={() => {
                setSortBy("random");
                setRandomSeed(Date.now());
              }}
              title={language === "id" ? "Tampilkan susunan karya secara acak" : "Randomize projects"}
            >
              <FiShuffle />
              <span>{language === "id" ? "Acak / Random" : "Random"}</span>
            </button>
          </div>
        </div>

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

            {sortedDeveloperProjects.length > 0 ? (
              <div className="portfolio-grid">
                {sortedDeveloperProjects.map((p, idx) => renderProjectCard(p, idx))}
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

            {sortedMultimediaProjects.length > 0 ? (
              <div className="portfolio-grid">
                {sortedMultimediaProjects.map((p, idx) => renderProjectCard(p, idx))}
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

