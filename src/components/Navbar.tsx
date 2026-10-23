import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import Lenis from "lenis";
import { FiSun, FiMoon } from "react-icons/fi";
import "./styles/Navbar.css";
import { usePortfolio } from "../context/PortfolioContext";

gsap.registerPlugin(ScrollTrigger);
export let lenis: Lenis | null = null;

const Navbar = () => {
  const { config, theme, toggleTheme, language, toggleLanguage } = usePortfolio();
  useEffect(() => {
    // Initialize Lenis smooth scroll
    lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    });

    // Start paused
    lenis.stop();

    // Connect Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // Handle resize
    window.addEventListener("resize", () => {
      lenis?.resize();
    });

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return (
    <>
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          {config.developer.initials}
        </a>
        <a
          href={`mailto:${config.contact.email}`}
          className="navbar-connect"
          data-cursor="disable"
        >
          {config.contact.email}
        </a>
        
        {/* Theme Mode & Circular Flag Language Controls */}
        <div className="header-actions">
          {/* Logo Pilihan Mode Terang & Gelap */}
          <button
            type="button"
            className={`nav-action-btn nav-theme-btn ${theme === "light" ? "is-light" : "is-dark"}`}
            onClick={toggleTheme}
            title={
              theme === "dark"
                ? language === "id"
                  ? "Beralih ke Mode Terang (Light Mode)"
                  : "Switch to Light Mode"
                : language === "id"
                ? "Beralih ke Mode Gelap (Dark Mode)"
                : "Switch to Dark Mode"
            }
            aria-label="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? (
              <FiSun className="theme-icon sun-icon" />
            ) : (
              <FiMoon className="theme-icon moon-icon" />
            )}
          </button>

          {/* Logo Pilihan Bahasa dengan Bendera di dalam Lingkaran */}
          <button
            type="button"
            className="nav-action-btn nav-lang-btn"
            onClick={toggleLanguage}
            title={
              language === "id"
                ? "Bahasa Indonesia (Klik untuk ganti ke English)"
                : "English (Click to switch to Bahasa Indonesia)"
            }
            aria-label="Toggle Language (Indonesia / English)"
          >
            <div className="flag-circle-wrapper">
              {language === "id" ? (
                /* Bendera Indonesia di dalam lingkaran */
                <svg
                  viewBox="0 0 32 32"
                  className="flag-circle-svg"
                  width="28"
                  height="28"
                  aria-hidden="true"
                >
                  <defs>
                    <clipPath id="circle-flag-id">
                      <circle cx="16" cy="16" r="14.5" />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#circle-flag-id)">
                    {/* Merah di atas */}
                    <rect x="0" y="0" width="32" height="16" fill="#e70011" />
                    {/* Putih di bawah */}
                    <rect x="0" y="16" width="32" height="16" fill="#ffffff" />
                  </g>
                  <circle
                    cx="16"
                    cy="16"
                    r="14.5"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                  />
                </svg>
              ) : (
                /* Bendera Inggris (UK Union Jack) di dalam lingkaran */
                <svg
                  viewBox="0 0 32 32"
                  className="flag-circle-svg"
                  width="28"
                  height="28"
                  aria-hidden="true"
                >
                  <defs>
                    <clipPath id="circle-flag-en">
                      <circle cx="16" cy="16" r="14.5" />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#circle-flag-en)">
                    <rect width="32" height="32" fill="#012169" />
                    {/* Garis diagonal putih */}
                    <path
                      d="M0,0 L32,32 M32,0 L0,32"
                      stroke="#ffffff"
                      strokeWidth="5.5"
                    />
                    {/* Garis diagonal merah */}
                    <path
                      d="M0,0 L32,32 M32,0 L0,32"
                      stroke="#C8102E"
                      strokeWidth="2.8"
                    />
                    {/* Salib tegak putih */}
                    <path
                      d="M16,0 V32 M0,16 H32"
                      stroke="#ffffff"
                      strokeWidth="8.5"
                    />
                    {/* Salib tegak merah */}
                    <path
                      d="M16,0 V32 M0,16 H32"
                      stroke="#C8102E"
                      strokeWidth="5"
                    />
                  </g>
                  <circle
                    cx="16"
                    cy="16"
                    r="14.5"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
