import { useState, useCallback } from "react";
import { MdArrowOutward } from "react-icons/md";
import { Link } from "react-router-dom";

interface Props {
  image: string;
  images?: string[];
  alt?: string;
  video?: string;
  link?: string;
}

const WorkImage = (props: Props) => {
  // All slides: use images[] if provided (non-empty), fallback to [image]
  const slides: string[] =
    props.images && props.images.length > 0 ? props.images : [props.image];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideo, setIsVideo] = useState(false);
  const [video, setVideo] = useState("");

  const isExternalLink = Boolean(props.link && !props.link.startsWith("/"));
  const hasMultiple = slides.length > 1;
  const currentSrc = slides[currentIndex] || "/images/placeholder.webp";

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/placeholder.webp";
  };

  const handleMouseEnter = async () => {
    if (props.video) {
      setIsVideo(true);
      const response = await fetch(`src/assets/${props.video}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setVideo(blobUrl);
    }
  };

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    },
    [slides.length]
  );

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goTo = useCallback((e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(idx);
  }, []);

  const SlideContent = (
    <div className="work-slide-wrapper">
      {/* Blur background — fills empty letterbox space */}
      <div
        className="work-slide-blur-bg"
        style={{ backgroundImage: `url(${currentSrc})` }}
        aria-hidden="true"
      />

      {/* Actual image — centered, aspect-preserved */}
      <img
        className="work-slide-img"
        src={currentSrc}
        alt={props.alt}
        loading="lazy"
        decoding="async"
        onError={handleImgError}
      />

      {isVideo && (
        <video
          className="work-slide-video"
          src={video}
          autoPlay
          muted
          playsInline
          loop
        />
      )}

      {/* Arrow button overlay — always present for clicking the link */}
      {props.link && (
        <div className="work-link">
          <MdArrowOutward />
        </div>
      )}

      {/* Slide controls */}
      {hasMultiple && (
        <>
          <button
            className="work-slide-prev"
            onClick={goPrev}
            aria-label="Foto sebelumnya"
          >
            ‹
          </button>
          <button
            className="work-slide-next"
            onClick={goNext}
            aria-label="Foto berikutnya"
          >
            ›
          </button>
          <div className="work-slide-dots">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`work-slide-dot${i === currentIndex ? " active" : ""}`}
                onClick={(e) => goTo(e, i)}
              />
            ))}
          </div>
          <div className="work-slide-counter">
            {currentIndex + 1} / {slides.length}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="work-image">
      {props.link ? (
        isExternalLink ? (
          <a
            className="work-image-in"
            href={props.link}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVideo(false)}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="disable"
          >
            {SlideContent}
          </a>
        ) : (
          <Link
            className="work-image-in"
            to={props.link}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVideo(false)}
            data-cursor="disable"
          >
            {SlideContent}
          </Link>
        )
      ) : (
        <div
          className="work-image-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsVideo(false)}
          data-cursor="disable"
        >
          {SlideContent}
        </div>
      )}
    </div>
  );
};

export default WorkImage;
