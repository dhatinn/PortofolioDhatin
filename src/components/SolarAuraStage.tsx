import { useEffect, useRef } from "react";
import "./styles/SolarAuraStage.css";
import { LOGOS_DATA, LogoData } from "./solarAuraLogos";

interface LogoState {
  data: LogoData;
  el: HTMLDivElement;
  customX: number;
  customY: number;
  isDragging: boolean;
  dragStartOffsetX: number;
  dragStartOffsetY: number;
  lastRenderedX: number;
  lastRenderedY: number;
}

interface SolarAuraStageProps {
  isPlaying?: boolean;
}

const ORIGIN_X = 46.0;
const ORIGIN_Y = 44.0;
const LOOP_DURATION_MS = 8000;
const OUTRO_START_MS = 6100;
const OUTRO_DURATION_MS = 1450;

function easeOutBackCubic(t: number): number {
  const c1 = 1.12;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

export const SolarAuraStage = ({ isPlaying = true }: SolarAuraStageProps) => {
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const bgPhotoRef = useRef<HTMLImageElement>(null);
  const personCutoutRef = useRef<HTMLImageElement>(null);
  const solarCoreRef = useRef<HTMLDivElement>(null);
  const solarShockwaveRef = useRef<HTMLDivElement>(null);
  const subjectRimLightRef = useRef<HTMLDivElement>(null);
  const logosContainerRef = useRef<HTMLDivElement>(null);

  // Animation timeline state in ref
  const animState = useRef({
    elapsedMs: 0,
    lastFrameTime: performance.now(),
    targetMouseX: 0,
    targetMouseY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    activeDraggedLogo: null as LogoState | null,
    isPlaying: isPlaying,
  });

  useEffect(() => {
    animState.current.isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const stageWrapper = stageWrapperRef.current;
    const bgPhoto = bgPhotoRef.current;
    const personCutout = personCutoutRef.current;
    const solarCore = solarCoreRef.current;
    const solarShockwave = solarShockwaveRef.current;
    const subjectRimLight = subjectRimLightRef.current;
    const logosContainer = logosContainerRef.current;

    if (!stageWrapper || !bgPhoto || !personCutout || !solarCore || !solarShockwave || !subjectRimLight || !logosContainer) {
      return;
    }

    // Clean up container before population
    logosContainer.innerHTML = "";
    const logoElements: LogoState[] = [];

    // Create 8 3D logo items
    LOGOS_DATA.forEach((item) => {
      const el = document.createElement("div");
      el.className = "logo-item";
      el.style.width = `${item.sizePercent}%`;
      el.style.aspectRatio = "1 / 1";
      el.style.zIndex = "15";
      el.style.opacity = "0";

      if (item.type === "tile") {
        el.innerHTML = `
          <div class="logo-solar-halo"></div>
          <div class="logo-solar-streak"></div>
          <div class="luxury-tile" style="${item.tileStyle || ""}">
            ${item.svg}
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="logo-solar-halo"></div>
          <div class="logo-solar-streak"></div>
          <div class="w-full h-full flex items-center justify-center relative">
            ${item.svg}
          </div>
        `;
      }

      const logoState: LogoState = {
        data: item,
        el,
        customX: item.targetX,
        customY: item.targetY,
        isDragging: false,
        dragStartOffsetX: 0,
        dragStartOffsetY: 0,
        lastRenderedX: ORIGIN_X,
        lastRenderedY: ORIGIN_Y,
      };

      // Pointer Down: Grab logo with mouse or touch
      const onPointerDown = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        el.setPointerCapture(e.pointerId);

        logoState.isDragging = true;
        animState.current.activeDraggedLogo = logoState;
        el.classList.add("is-dragging");
        el.style.zIndex = "60";

        const rect = stageWrapper.getBoundingClientRect();
        if (rect.width && rect.height) {
          const pointerXPercent = ((e.clientX - rect.left) / rect.width) * 100;
          const pointerYPercent = ((e.clientY - rect.top) / rect.height) * 100;
          logoState.dragStartOffsetX = logoState.lastRenderedX - pointerXPercent;
          logoState.dragStartOffsetY = logoState.lastRenderedY - pointerYPercent;
        }
      };

      // Pointer Move: Drag logo smoothly across stage
      const onPointerMove = (e: PointerEvent) => {
        if (!logoState.isDragging) return;
        const rect = stageWrapper.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const pointerXPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const pointerYPercent = ((e.clientY - rect.top) / rect.height) * 100;

        logoState.customX = Math.max(4, Math.min(96, pointerXPercent + logoState.dragStartOffsetX));
        logoState.customY = Math.max(6, Math.min(94, pointerYPercent + logoState.dragStartOffsetY));
      };

      const endLogoDrag = (e: PointerEvent) => {
        if (!logoState.isDragging) return;
        logoState.isDragging = false;
        if (animState.current.activeDraggedLogo === logoState) {
          animState.current.activeDraggedLogo = null;
        }
        el.classList.remove("is-dragging");
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      };

      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", endLogoDrag);
      el.addEventListener("pointercancel", endLogoDrag);

      logosContainer.appendChild(el);
      logoElements.push(logoState);
    });

    // Parallax mouse tracker on stage
    const handleStagePointerMove = (e: PointerEvent) => {
      const rect = stageWrapper.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      animState.current.targetMouseX = Math.max(-1, Math.min(1, nx));
      animState.current.targetMouseY = Math.max(-1, Math.min(1, ny));
    };

    const handleStagePointerLeave = () => {
      animState.current.targetMouseX = 0;
      animState.current.targetMouseY = 0;
    };

    stageWrapper.addEventListener("pointermove", handleStagePointerMove);
    stageWrapper.addEventListener("pointerleave", handleStagePointerLeave);

    // Main requestAnimationFrame loop
    let reqId: number;
    animState.current.lastFrameTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(50, now - animState.current.lastFrameTime);
      animState.current.lastFrameTime = now;

      // Advance timeline if isPlaying
      if (animState.current.isPlaying) {
        // Pause outro if user is actively dragging a logo
        if (
          animState.current.activeDraggedLogo &&
          animState.current.elapsedMs > OUTRO_START_MS - 300 &&
          animState.current.elapsedMs < OUTRO_START_MS + 200
        ) {
          animState.current.elapsedMs = OUTRO_START_MS - 300;
        } else {
          animState.current.elapsedMs += dt;
        }

        if (animState.current.elapsedMs >= LOOP_DURATION_MS) {
          animState.current.elapsedMs = 0;
        }
      }

      const elapsedMs = animState.current.elapsedMs;

      // Smooth mouse interpolation
      animState.current.currentMouseX +=
        (animState.current.targetMouseX - animState.current.currentMouseX) * 0.08;
      animState.current.currentMouseY +=
        (animState.current.targetMouseY - animState.current.currentMouseY) * 0.08;

      const curMx = animState.current.currentMouseX;
      const curMy = animState.current.currentMouseY;

      // Global Outro Fade factor for Solar Core (fades out cleanly between 6100ms and 7550ms)
      let outroFade = 1;
      if (elapsedMs > OUTRO_START_MS) {
        outroFade = Math.max(0, 1 - (elapsedMs - OUTRO_START_MS) / OUTRO_DURATION_MS);
      }

      // 1. Lightweight GPU Transform on Background Photo & Subject Cutout
      const introZoom = Math.min(1, elapsedMs / 3000) * outroFade;
      const scaleBg = 1.0 + 0.018 * introZoom;
      const bgShiftX = (curMx * -5).toFixed(1);
      const bgShiftY = (curMy * -3.5).toFixed(1);
      bgPhoto.style.transform = `translate3d(${bgShiftX}px, ${bgShiftY}px, 0) scale(${scaleBg.toFixed(3)})`;

      const personShiftX = (curMx * 3.5).toFixed(1);
      const personShiftY = (curMy * 2.5).toFixed(1);
      const scalePerson = 1.0 + 0.026 * introZoom;
      personCutout.style.transform = `translate3d(${personShiftX}px, ${personShiftY}px, 0) scale(${scalePerson.toFixed(3)})`;

      // 2. Smooth Solar Core Behind Subject
      let solarProgress = 0;
      if (elapsedMs > 800) {
        solarProgress = Math.min(1, (elapsedMs - 800) / 750) * outroFade;
      }
      const pulseSolar = 1 + 0.05 * Math.sin(elapsedMs * 0.003);
      const solarScale = solarProgress * pulseSolar;
      solarCore.style.transform = `translate3d(-50%, -50%, 0) scale(${solarScale.toFixed(3)})`;
      solarCore.style.opacity = Math.min(1, solarProgress * 1.1).toFixed(3);

      // Lightweight Backlight Rim Aura Behind Subject
      subjectRimLight.style.opacity = Math.min(1, solarProgress * 0.95).toFixed(3);
      subjectRimLight.style.transform = `translate3d(calc(-50% + ${personShiftX}px), calc(-50% + ${personShiftY}px), 0) scale(${(0.95 + 0.08 * pulseSolar).toFixed(3)})`;

      // Expanding Shockwave Ring on Burst
      if (elapsedMs > 950 && elapsedMs < 2100) {
        const swP = (elapsedMs - 950) / 1150;
        solarShockwave.style.opacity = ((1 - swP) * 0.75).toFixed(3);
        solarShockwave.style.transform = `scale(${(0.2 + swP * 2.1).toFixed(3)})`;
      } else {
        solarShockwave.style.opacity = "0";
      }

      // 3. Update All 8 Unique 3D Logos (Emerge -> Float/Drag -> Outro Zoom-In Fly Out)
      const emergeStartBase = 1000;

      logoElements.forEach((state) => {
        const { data, el } = state;
        const localTime = elapsedMs - (emergeStartBase + data.delayMs);

        if (localTime <= 0 && !state.isDragging) {
          el.style.opacity = "0";
          return;
        }

        // Phase A: Emergence progress (0 -> 1)
        const rawInP = state.isDragging ? 1 : Math.min(1, Math.max(0, localTime / data.durationMs));
        const easedInP = easeOutBackCubic(rawInP);

        // Phase B: Outro Zoom-In Out of Frame progress (0 -> 1)
        let rawOutP = 0;
        const logoOutStart = OUTRO_START_MS + data.delayMs * 0.45;
        if (!state.isDragging && elapsedMs > logoOutStart) {
          rawOutP = Math.min(1, (elapsedMs - logoOutStart) / (OUTRO_DURATION_MS - 150));
        }
        const easedOutP = easeInCubic(rawOutP);

        if (rawOutP >= 1 && !state.isDragging) {
          el.style.opacity = "0";
          return;
        }

        // Base X & Y interpolation from behind subject (ORIGIN_X, ORIGIN_Y) to custom/target position
        let curX = ORIGIN_X + (state.customX - ORIGIN_X) * easedInP;
        let curY = ORIGIN_Y + (state.customY - ORIGIN_Y) * easedInP;

        // Outro Radial Fly-Out (Logo zooms outward past frame edges)
        if (rawOutP > 0) {
          const dirX = state.customX - 50;
          const dirY = state.customY - 50;
          curX += dirX * 1.45 * easedOutP;
          curY += dirY * 1.45 * easedOutP;
        }

        state.lastRenderedX = curX;
        state.lastRenderedY = curY;

        // Floating oscillation & mouse parallax
        let floatOffsetX = 0;
        let floatOffsetY = 0;
        let floatRot = 0;
        let pxOffset = 0;
        let pyOffset = 0;

        if (!state.isDragging) {
          const floatTime = elapsedMs * 0.0018 * data.floatSpeed + data.phaseOffset;
          floatOffsetY = Math.sin(floatTime) * data.floatAmpY * rawInP * (1 - easedOutP);
          floatOffsetX = Math.cos(floatTime * 0.75) * (data.floatAmpY * 0.4) * rawInP * (1 - easedOutP);
          floatRot = Math.sin(floatTime * 0.9) * 4.2 * rawInP;

          pxOffset = curMx * 22 * data.parallaxFactor * rawInP;
          pyOffset = curMy * 15 * data.parallaxFactor * rawInP;
        }

        // Depth Z-Index Management:
        // Starts behind personCutout (z-index 16 < 30), then moves to front plane during float or outro
        if (state.isDragging) {
          el.style.zIndex = "60";
        } else if (rawOutP > 0.05) {
          el.style.zIndex = "52";
        } else if (data.crossToFront && rawInP > 0.42) {
          el.style.zIndex = String(data.finalZ);
        } else if (!data.crossToFront && rawInP > 0.35) {
          el.style.zIndex = String(data.finalZ);
        } else {
          el.style.zIndex = "16";
        }

        // Scale: 0.16 behind body -> 1.0 floating -> 2.85x Zoom-In on Outro!
        const inScale = Math.max(0.05, 0.16 + 0.84 * easedInP);
        const outZoomScale = 1 + 1.85 * easedOutP;
        const dragScaleBoost = state.isDragging ? 1.08 : 1.0;
        const finalScale = inScale * outZoomScale * dragScaleBoost;

        const rotVal = (data.baseRotate - 28 * (1 - easedInP)) + floatRot + (easedOutP * 18);

        // Bokeh Blur
        const emergenceBlur = (1 - rawInP) * 6.0;
        const restingBokeh = state.isDragging ? 0 : (data.blurPx * rawInP);
        const outroZoomBlur = easedOutP * 12.0;
        const totalBlur = (emergenceBlur + restingBokeh + outroZoomBlur).toFixed(1);

        // Opacity
        const inAlpha = Math.min(1, rawInP * 2.8);
        const outAlpha = Math.max(0, 1 - Math.pow(rawOutP, 1.5));
        const finalOpacity = (inAlpha * outAlpha).toFixed(3);

        el.style.opacity = finalOpacity;
        el.style.left = `${curX.toFixed(2)}%`;
        el.style.top = `${curY.toFixed(2)}%`;
        el.style.transform = `translate3d(calc(-50% + ${(floatOffsetX + pxOffset).toFixed(1)}px), calc(-50% + ${(floatOffsetY + pyOffset).toFixed(1)}px), 0) scale(${finalScale.toFixed(3)}) rotate(${rotVal.toFixed(1)}deg)`;
        el.style.filter = parseFloat(totalBlur) > 0.1 ? `blur(${totalBlur}px)` : "none";
      });

      reqId = requestAnimationFrame(loop);
    };

    reqId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(reqId);
      stageWrapper.removeEventListener("pointermove", handleStagePointerMove);
      stageWrapper.removeEventListener("pointerleave", handleStagePointerLeave);
      logosContainer.innerHTML = "";
    };
  }, []);

  return (
    <div className="hero-solar-stage-container">
      <div id="stageWrapper" ref={stageWrapperRef} className="stage-wrapper group">
        {/* Layer 1: Clean Background Photo */}
        <img
          id="bgPhoto"
          ref={bgPhotoRef}
          src="/images/hero_bg_clean.webp"
          alt="Background Portrait"
          className="bg-photo-layer"
        />

        {/* Warm Solar Cinema Grade */}
        <div id="cinemaGrade" className="cinema-grade-layer" />

        {/* Layer 2: Smooth Solar Sun Core & Volumetric Rays Behind Subject */}
        <div id="solarCore" ref={solarCoreRef} className="solar-core-container">
          <div className="solar-god-rays" />
          <div className="solar-aura-glow" />
          <div id="solarShockwave" ref={solarShockwaveRef} className="solar-shockwave" />
        </div>

        {/* Layer 3: Container for 8 Unique 3D Floating & Draggable Logos */}
        <div id="logosContainer" ref={logosContainerRef} className="stage-logos-container" />

        {/* Lightweight Solar Rim Backlight Behind Subject Cutout */}
        <div id="subjectRimLight" ref={subjectRimLightRef} className="subject-rim-backlight" />

        {/* Layer 4: Foreground Subject Cutout (Occludes logos emerging from behind) */}
        <img
          id="personCutout"
          ref={personCutoutRef}
          src="/images/hero_person_cutout.webp"
          alt="Subject Cutout Layer"
          className="person-cutout-layer"
        />

        {/* Cinematic Vignette */}
        <div className="hero-stage-vignette" />
      </div>
    </div>
  );
};

export default SolarAuraStage;
