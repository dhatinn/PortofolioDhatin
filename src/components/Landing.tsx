import { useRef, useEffect } from "react";
import "./styles/Landing.css";
import { usePortfolio } from "../context/PortfolioContext";
import { useLoading } from "../context/LoadingProvider";
import LanyardCanvas from "./Lanyard";

const Landing = () => {
  const { config } = usePortfolio();
  const { isLoading } = useLoading();
  const videoRef = useRef<HTMLVideoElement>(null);

  const nameParts = (config.developer.fullName || "").split(" ");
  const firstName = nameParts[0] || config.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isLoading) {
      // User has entered the website -> play video from beginning and loop
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser restricts un-interacted autoplay, play on first interaction
          const handleFirstPlay = () => {
            video.play();
            window.removeEventListener("click", handleFirstPlay);
            window.removeEventListener("scroll", handleFirstPlay);
            window.removeEventListener("touchstart", handleFirstPlay);
          };
          window.addEventListener("click", handleFirstPlay);
          window.addEventListener("scroll", handleFirstPlay);
          window.addEventListener("touchstart", handleFirstPlay);
        });
      }
    } else {
      // While on loading/welcome screen -> keep paused
      video.pause();
    }
  }, [isLoading]);

  return (
    <>
      <div className="landing-section" id="landingDiv">
        {/* Looping Hero Background Video with 75% opacity and black vignette */}
        <div className="landing-video-bg-container">
          <video
            ref={videoRef}
            className="landing-bg-video"
            src="/video.mp4"
            loop
            muted
            playsInline
            preload="auto"
            onEnded={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
              }
            }}
          />
          <div className="landing-video-vignette" />
        </div>

        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              {firstName.toUpperCase()}{" "}
              <br />
              {lastName && <span>{lastName.toUpperCase()}</span>}
            </h1>
          </div>
          <div className="landing-info">
            <h3>A</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">{config.developer.taglines[0]}</div>
            </h2>
            <h2 className="landing-info-sub">
              <div className="landing-h2-info">
                {config.developer.taglines.slice(1).join(" & ")}
              </div>
            </h2>
          </div>
        </div>

        {/* Interactive 3D Lanyard ID Badge */}
        <LanyardCanvas />
      </div>
    </>
  );
};

export default Landing;
