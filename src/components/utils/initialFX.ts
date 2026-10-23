import { TextSplitter } from "../../utils/textSplitter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenis } from "../Navbar";
import { setAllTimeline } from "./GsapScroll";

export function initialFX() {
  document.body.style.overflowY = "auto";
  if (lenis) {
    lenis.start();
  }
  setAllTimeline();
  ScrollTrigger.refresh();
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 400);
  document.getElementsByTagName("main")[0].classList.add("main-active");
  gsap.to("body", {
    backgroundColor: "#0c0a09",
    duration: 0.5,
    delay: 0.2,
  });

  // Entrance from outer sides with zoom into place (Photo 3 design)
  gsap.fromTo(
    ".landing-intro",
    { opacity: 0, x: -140, scale: 0.88, filter: "blur(6px)" },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: 1.3,
      ease: "power3.out",
      delay: 0.1,
    }
  );

  gsap.fromTo(
    ".landing-info",
    { opacity: 0, x: 140, scale: 0.88, filter: "blur(6px)" },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: 1.3,
      ease: "power3.out",
      delay: 0.1,
    }
  );

  gsap.fromTo(
    ".landing-video-bg-container",
    { opacity: 0, scale: 1.05 },
    {
      opacity: 1,
      scale: 1,
      duration: 1.6,
      ease: "power2.out",
      delay: 0.1,
    }
  );

  const selectors = [".landing-info h3", ".landing-intro h2", ".landing-intro h1"];
  const elements = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
  var landingText = new TextSplitter(elements, {
    type: "chars,lines",
    linesClass: "split-line",
  });
  gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  let TextProps = { type: "chars,lines", linesClass: "split-h2" };

  var landingText4 = new TextSplitter(".landing-h2-1", TextProps);
  if (landingText4.chars && landingText4.chars.length > 0) {
    gsap.fromTo(
      landingText4.chars,
      { opacity: 0, y: 50, filter: "blur(5px)" },
      {
        opacity: 1,
        duration: 1.2,
        filter: "blur(0px)",
        ease: "power3.inOut",
        y: 0,
        stagger: 0.02,
        delay: 0.25,
      }
    );
  }

  var landingText2 = new TextSplitter(".landing-h2-info", TextProps);
  if (landingText2.chars && landingText2.chars.length > 0) {
    gsap.fromTo(
      landingText2.chars,
      { opacity: 0, y: 50, filter: "blur(5px)" },
      {
        opacity: 1,
        duration: 1.2,
        filter: "blur(0px)",
        ease: "power3.inOut",
        y: 0,
        stagger: 0.02,
        delay: 0.4,
      }
    );
  }

  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      delay: 0.1,
    }
  );
}
