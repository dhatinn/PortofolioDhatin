import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiExternalLink } from "react-icons/fi";
import "./ShowcaseCarousel.css";

export interface ShowcaseItem {
  id?: string | number;
  slug?: string;
  src: string;
  alt?: string;
  title: string;
  subtitle?: string;
  category?: string;
  year?: string | number;
}

export interface ShowcaseCarouselProps {
  items: ShowcaseItem[];
  placeholderImage?: string;
  language?: string;
  className?: string;
}

// Fisher-Yates random shuffle helper
function shuffleItems<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const ShowcaseCarousel: React.FC<ShowcaseCarouselProps> = ({
  items,
  placeholderImage = "/images/mypicnbg.png",
  language = "id",
  className = "",
}) => {
  // Randomize sequence on mount as requested: "sama mau di bagian ini random urutannya"
  const randomizedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return shuffleItems(items);
  }, [items]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const total = randomizedItems.length;

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  if (total === 0) return null;

  const currentItem = randomizedItems[currentIndex];

  return (
    <div className={`showcase-carousel-root ${className}`}>
      {/* 3-Card Stage Area with Left & Right Arrow Navigation */}
      <div className="showcase-carousel-stage">
        {/* Navigation Arrow Left */}
        <button
          type="button"
          className="showcase-nav-arrow prev"
          onClick={handlePrev}
          aria-label={language === "id" ? "Karya sebelumnya" : "Previous project"}
          title={language === "id" ? "Karya sebelumnya (Panah Kiri)" : "Previous project (Left Arrow)"}
        >
          <FiChevronLeft />
        </button>

        {/* 3 Visible Cards Track: Left, Center (Highlighted & Enlarged), Right */}
        <div className="showcase-cards-track">
          {randomizedItems.map((item, index) => {
            // Calculate cyclic offset relative to currentIndex (-1, 0, 1)
            let offset = (index - currentIndex + total) % total;
            if (offset > total / 2) {
              offset -= total;
            }

            // Exactly 3 items visible on screen as requested: "di layare yang mucul jangan kebanyakan 3 saja"
            const isVisible = Math.abs(offset) <= 1;
            if (!isVisible) return null;

            const isCenter = offset === 0;
            const isLeft = offset === -1;
            const isRight = offset === 1;

            const positionClass = isCenter ? "center" : isLeft ? "left" : "right";
            const detailLink = item.slug ? `/projectportofolio/${item.slug}` : undefined;

            return (
              <div
                key={`${item.slug || item.id || index}_${index}`}
                className={`showcase-card ${positionClass}`}
                onClick={() => {
                  if (isLeft) handlePrev();
                  else if (isRight) handleNext();
                }}
                title={
                  isLeft
                    ? language === "id" ? "Klik untuk geser ke kiri" : "Click to view previous"
                    : isRight
                    ? language === "id" ? "Klik untuk geser ke kanan" : "Click to view next"
                    : item.title
                }
              >
                {/* Blur Letterbox Background so aspect ratios are NEVER cut off */}
                <div
                  className="showcase-card-blur-bg"
                  style={{ backgroundImage: `url(${item.src || placeholderImage})` }}
                  aria-hidden="true"
                />

                {/* Main Card Image */}
                <div className="showcase-card-img-wrapper">
                  <img
                    src={item.src || placeholderImage}
                    alt={item.title || item.alt || "Project showcase"}
                    className="showcase-card-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholderImage;
                    }}
                  />
                </div>

                {/* Category Badge on card */}
                {item.category && (
                  <div className="showcase-card-badge">
                    <span>{item.category}</span>
                  </div>
                )}

                {/* Interactive Detail Link button on Center Highlight card */}
                {isCenter && detailLink && (
                  <Link
                    to={detailLink}
                    className="showcase-card-center-link"
                    title={language === "id" ? "Buka detail proyek" : "View project detail"}
                    data-cursor="disable"
                  >
                    <span>{language === "id" ? "Buka Detail" : "View Details"}</span>
                    <FiExternalLink />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Arrow Right */}
        <button
          type="button"
          className="showcase-nav-arrow next"
          onClick={handleNext}
          aria-label={language === "id" ? "Karya berikutnya" : "Next project"}
          title={language === "id" ? "Karya berikutnya (Panah Kanan)" : "Next project (Right Arrow)"}
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Captions and Counter Info Below the Stage */}
      {currentItem && (
        <div className="showcase-carousel-caption">
          <h3 className="showcase-caption-title">
            {currentItem.slug ? (
              <Link to={`/projectportofolio/${currentItem.slug}`} className="showcase-title-link">
                {currentItem.title}
              </Link>
            ) : (
              currentItem.title
            )}
          </h3>

          <div className="showcase-caption-meta">
            {currentItem.subtitle && (
              <span className="showcase-caption-sub">{currentItem.subtitle}</span>
            )}
            <span className="showcase-caption-counter">
              {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>

          {/* Dots Indicator */}
          {total > 1 && (
            <div className="showcase-dots-bar">
              {randomizedItems.slice(0, Math.min(total, 12)).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`showcase-dot ${idx === currentIndex % Math.min(total, 12) ? "active" : ""}`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Pindah ke slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowcaseCarousel;
