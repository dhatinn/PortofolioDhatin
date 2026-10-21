import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let intensity: number = 0;
let intensityInterval: ReturnType<typeof setInterval> | null = null;
if (!intensityInterval) {
  intensityInterval = setInterval(() => {
    intensity = Math.random();
  }, 200);
}

export function setCharTimeline(
  character: THREE.Object3D<THREE.Object3DEventMap> | null,
  camera: THREE.PerspectiveCamera
) {
  ScrollTrigger.getById("char-master")?.kill();
  ScrollTrigger.getById("char-tl1")?.kill();
  ScrollTrigger.getById("char-tl2")?.kill();
  ScrollTrigger.getById("char-tl3")?.kill();

  if (!character) return;

  let screenLight: any = null;
  const deskMaterials: any[] = [];

  character?.traverse((object: any) => {
    if (object.name === "Plane004" || object.name.includes("Plane004")) {
      object.traverse((child: any) => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = 0;
          if (!deskMaterials.includes(child.material)) {
            deskMaterials.push(child.material);
          }
          if (child.material.name === "Material.027") {
            child.material.color?.set("#FFFFFF");
          }
        }
      });
    }
    if (object.name === "screenlight") {
      object.material.transparent = true;
      object.material.opacity = 0;
      object.material.emissive?.set("#C8BFFF");
      gsap.timeline({ repeat: -1, repeatRefresh: true }).to(object.material, {
        emissiveIntensity: () => intensity * 8,
        duration: () => Math.random() * 0.6,
        delay: () => Math.random() * 0.1,
      });
      screenLight = object;
    }
  });

  const neckBone =
    character?.getObjectByName("spine005") ||
    character?.getObjectByName("spine.006") ||
    character?.getObjectByName("spine006");

  if (window.innerWidth > 1024) {
    if (character) {
      const masterTl = gsap.timeline({
        scrollTrigger: {
          id: "char-master",
          trigger: ".landing-section",
          endTrigger: ".whatIDO",
          start: "top top",
          end: "bottom top",
          scrub: 0.3,
          invalidateOnRefresh: true,
        },
      });

      // === PHASE 1: Landing -> About Me (0 to 4s) ===
      masterTl
        .fromTo(character.rotation, { y: 0 }, { y: 0.7, duration: 3.5, ease: "power1.out" }, 0)
        .to(camera.position, { z: 22, duration: 3.5, ease: "power1.out" }, 0)
        .fromTo(".character-model", { x: 0 }, { x: "-25%", duration: 3.5, ease: "power1.out" }, 0)
        .to(".landing-container", { opacity: 0, duration: 1.5, ease: "power1.out" }, 0)
        .to(".landing-container", { y: "40%", duration: 3, ease: "power1.out" }, 0)
        .fromTo(".about-me", { y: "-50%" }, { y: "0%", duration: 3, ease: "power1.out" }, 0.5);

      // === PHASE 2: About Me -> What I Do (4s to 8s) ===
      masterTl
        .to(".about-section", { opacity: 0, duration: 2, ease: "power1.out" }, 4)
        .to(".about-section", { y: "20%", duration: 3, ease: "power1.out" }, 4)
        .to(camera.position, { z: 75, y: 8.4, duration: 3.8, ease: "power2.out" }, 4.1)
        .to(".character-model", { x: "-2%", duration: 3.8, ease: "power2.out", pointerEvents: "none" }, 4.1)
        .to(character.rotation, { y: 0.92, x: 0.12, duration: 3, ease: "power1.out" }, 4.3);

      if (neckBone) {
        masterTl.to(neckBone.rotation, { x: 0.6, duration: 3, ease: "power1.out" }, 4.3);
      }

      deskMaterials.forEach((mat) => {
        masterTl.to(mat, { opacity: 1, duration: 2.5, ease: "power1.out" }, 4.3);
      });

      if (screenLight?.material) {
        masterTl.to(screenLight.material, { opacity: 1, duration: 2.5, ease: "power1.out" }, 4.5);
      }

      masterTl.fromTo(
        ".character-rim",
        { opacity: 1, scaleX: 1.4 },
        { opacity: 0, scale: 0, y: "-70%", duration: 2.5, ease: "power1.out" },
        4.1
      );

      // === PHASE 3: What I Do view & Career exit (8s to 12s) ===
      // From 8s to 10s: character is stably typing at desk in What I Do
      // From 10s to 12s: character scrolls away into Career
      masterTl
        .fromTo(
          ".character-model",
          { y: "0%" },
          { y: "-100%", duration: 2, ease: "power1.in" },
          10
        )
        .fromTo(".whatIDO", { y: 0 }, { y: "15%", duration: 2, ease: "power1.out" }, 10)
        .to(character.rotation, { x: -0.04, duration: 2 }, 10);
    }
  } else {
    if (character) {
      const tM2 = gsap.timeline({
        scrollTrigger: {
          trigger: ".what-box-in",
          start: "top 70%",
          end: "bottom top",
        },
      });
      tM2.to(".what-box-in", { display: "flex", duration: 0.1, delay: 0 }, 0);
    }
  }
}

export function setAllTimeline() {
  const careerTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".career-section",
      start: "top 50%",
      end: "bottom 30%",
      scrub: 1.5,
      invalidateOnRefresh: true,
    },
  });
  careerTimeline
    .fromTo(
      ".career-timeline",
      { maxHeight: "0%" },
      { maxHeight: "100%", duration: 1, ease: "none" },
      0
    )

    .fromTo(
      ".career-timeline",
      { opacity: 0 },
      { opacity: 1, duration: 0.2 },
      0
    )
    .fromTo(
      ".career-info-box",
      { opacity: 0 },
      { opacity: 1, stagger: 0.1, duration: 0.5 },
      0
    )
    .fromTo(
      ".career-dot",
      { animationIterationCount: "infinite" },
      {
        animationIterationCount: "1",
        delay: 0.3,
        duration: 0.1,
      },
      0
    );

  if (window.innerWidth > 1024) {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: "20%", duration: 0.5, delay: 0.2 },
      0
    );
  } else {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: 0, duration: 0.5, delay: 0.2 },
      0
    );
  }
}
