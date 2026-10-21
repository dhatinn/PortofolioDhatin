import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../Loading";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    if (!canvasDiv.current) return;

    let isMounted = true;
    const containerEl = canvasDiv.current;
    const rect = containerEl.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    const aspect = width / height;

    // Create a dedicated Three.js Scene for this mount instance
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    // Cap pixel ratio to 1.25 for buttery smooth 60-120fps on High-DPI/4K screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // Ensure no old canvas remains inside container
    containerEl.querySelectorAll("canvas").forEach((c) => c.remove());
    containerEl.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: any | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let characterObj: THREE.Object3D | null = null;
    let removeHover: (() => void) | undefined;
    let onResize: (() => void) | undefined;

    const clock = new THREE.Clock();
    const light = setLighting(scene);
    const progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    loadCharacter().then((gltf) => {
      if (!isMounted || !gltf) return;

      // Remove any prior character models from the scene to prevent duplication
      for (let i = scene.children.length - 1; i >= 0; i--) {
        const child = scene.children[i];
        if (
          child.type === "Group" ||
          child.name === "characterModelGroup" ||
          child.name.includes("metarig")
        ) {
          scene.remove(child);
        }
      }

      characterObj = gltf.scene;
      characterObj.name = "characterModelGroup";
      scene.add(characterObj);

      const animations = setAnimations(gltf);
      mixer = animations.mixer;

      if (hoverDivRef.current) {
        removeHover = animations.hover(gltf, hoverDivRef.current);
      }

      headBone =
        characterObj.getObjectByName("spine006") ||
        characterObj.getObjectByName("spine.006") ||
        null;
      screenLight = characterObj.getObjectByName("screenlight") || null;

      // Safely start lights and intro animation
      let started = false;
      const triggerStart = () => {
        if (started || !isMounted) return;
        started = true;
        light.turnOnLights();
        animations.startIntro();
        ScrollTrigger.refresh();
      };

      progress.loaded().then(triggerStart);
      // Fallback timer so lights/intro always trigger even if loading screen completes early
      setTimeout(() => {
        triggerStart();
        ScrollTrigger.refresh();
      }, 400);

      onResize = () => {
        if (!isMounted || !characterObj) return;
        handleResize(renderer, camera, canvasDiv, characterObj);
      };
      window.addEventListener("resize", onResize, { passive: true });
    });

    let mouse = { x: 0, y: 0 };
    let interpolation = { x: 0.1, y: 0.2 };

    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => {
        mouse = { x, y };
      });
    };

    let debounce: ReturnType<typeof setTimeout> | undefined;
    const onTouchStart = (event: TouchEvent) => {
      const element = event.target as HTMLElement;
      debounce = setTimeout(() => {
        element?.addEventListener(
          "touchmove",
          (e: TouchEvent) =>
            handleTouchMove(e, (x, y) => {
              mouse = { x, y };
            }),
          { passive: true }
        );
      }, 200);
    };

    const onTouchEnd = () => {
      handleTouchEnd((x, y, interpolationX, interpolationY) => {
        mouse = { x, y };
        interpolation = { x: interpolationX, y: interpolationY };
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    const landingDiv = document.getElementById("landingDiv");
    if (landingDiv) {
      landingDiv.addEventListener("touchstart", onTouchStart, { passive: true });
      landingDiv.addEventListener("touchend", onTouchEnd, { passive: true });
    }

    // Smart Offscreen Culling: Only render when 3D hero/about/whatIDO sections are visible
    let isVisible = true;
    let animId: number;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((e) => e.isIntersecting);
      },
      { rootMargin: "150px" }
    );
    const sections = document.querySelectorAll(
      ".landing-section, .about-section, .whatIDO"
    );
    sections.forEach((sec) => observer.observe(sec));

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      if (headBone) {
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp
        );
        light.setPointLight(screenLight);
      }
      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      observer.disconnect();
      clearTimeout(debounce);

      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(characterObj!);
      }

      if (onResize) {
        window.removeEventListener("resize", onResize);
      }
      if (removeHover) {
        removeHover();
      }

      window.removeEventListener("mousemove", onMouseMove);
      if (landingDiv) {
        landingDiv.removeEventListener("touchstart", onTouchStart);
        landingDiv.removeEventListener("touchend", onTouchEnd);
      }

      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === containerEl) {
        containerEl.removeChild(renderer.domElement);
      }
    };
  }, [setLoading]);

  return (
    <div className="character-container">
      <div className="character-model" ref={canvasDiv}>
        <div className="character-rim"></div>
        <div className="character-hover" ref={hoverDivRef}></div>
      </div>
    </div>
  );
};

export default Scene;
