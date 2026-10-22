import * as THREE from "three";
import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { usePortfolio } from "../../context/PortfolioContext";
import { createCardTexture } from "./cardTexture";

extend({ MeshLineGeometry, MeshLineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: any;
      meshLineMaterial: any;
    }
  }
}

const segmentProps = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 2,
  linearDamping: 2,
} as const;

import { ProfileData, PortfolioConfig } from "../../types/portfolio";

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  profile?: ProfileData;
  config?: PortfolioConfig;
  wrapperRef?: React.RefObject<HTMLDivElement>;
}

export default function Band({
  maxSpeed = 50,
  minSpeed = 10,
  profile: propProfile,
  config: propConfig,
  wrapperRef,
}: BandProps) {
  const contextPortfolio = usePortfolio();
  const profile = propProfile || contextPortfolio.profile;
  const config = propConfig || contextPortfolio.config;

  const band = useRef<THREE.Mesh<any, any>>(null);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);

  // Responsive card scale: on laptop screens (<1600px), use 1.8; on wide screens, use 2.15
  const [cardScale, setCardScale] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1200) return 1.65;
      if (window.innerWidth < 1600) return 1.8;
    }
    return 2.15;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 1200) {
        setCardScale(1.65);
      } else if (w < 1600) {
        setCardScale(1.8);
      } else {
        setCardScale(2.15);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  const { nodes, materials } = useGLTF("/assets/3d/card.glb") as any;
  const ribbonTexture = useTexture("/assets/images/tag_texture.png");

  // Dynamic canvas texture for card based on Admin config
  const [cardTexture, setCardTexture] = useState<THREE.CanvasTexture | null>(null);
  const [textureVersion, setTextureVersion] = useState(0);

  useEffect(() => {
    const photo = profile?.photo || config.developer.photo || "/images/mypicnbg.png";
    const name = profile?.name || config.developer.fullName || config.developer.name || "Dhatin Nuril Arsandy";
    const role = profile?.badge?.badgeRole || profile?.taglines?.[0] || config.developer.taglines?.[0] || config.developer.title || "Full-Stack Developer";
    const initials = profile?.badge?.initials || config.developer.initials || "DN";
    const badgeId = profile?.badge?.badgeId || "DEV ID • VERIFIED";
    const subText = profile?.badge?.subText || "ID: 2026-DHATIN-DEV-SECURE";
    const accentColor = profile?.badge?.accentColor || "#ff7a00";

    const tex = createCardTexture(
      {
        photoUrl: photo,
        name,
        role,
        initials,
        badgeId,
        subText,
        accentColor,
      },
      () => {
        // Trigger re-render when image finishes loading
        setTextureVersion((v) => v + 1);
      }
    );
    setCardTexture(tex);
    setTextureVersion((v) => v + 1);

    return () => {
      tex.dispose();
    };
  }, [
    profile?.photo,
    profile?.name,
    profile?.taglines,
    profile?.badge?.badgeRole,
    profile?.badge?.initials,
    profile?.badge?.badgeId,
    profile?.badge?.subText,
    profile?.badge?.accentColor,
    config.developer.photo,
    config.developer.fullName,
    config.developer.name,
    config.developer.taglines,
    config.developer.initials,
    config.developer.title,
  ]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);

  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
    return () => void (document.body.style.cursor = "auto");
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (
      !fixed.current ||
      !j1.current ||
      !j2.current ||
      !j3.current ||
      !band.current ||
      !card.current
    )
      return;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current) {
      const [j1Lerped, j2Lerped] = [j1, j2].map((ref) => {
        if (ref.current) {
          const lerped = new THREE.Vector3().copy(ref.current.translation() as any);
          const clampedDistance = Math.max(
            0.1,
            Math.min(1, lerped.distanceTo(ref.current.translation() as any))
          );
          return lerped.lerp(
            ref.current.translation() as any,
            delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
          );
        }
      });

      curve.points[0].copy(j3.current.translation() as any);
      curve.points[1].copy(j2Lerped ?? (j2.current.translation() as any));
      curve.points[2].copy(j1Lerped ?? (j1.current.translation() as any));
      curve.points[3].copy(fixed.current.translation() as any);
      // Natural band curve tracking
      band.current.geometry.setPoints(curve.getPoints(32));
    }

    // -------------------------------------------------------------
    // Scroll-driven Zoom & Transition onto Left Side for About Me
    // -------------------------------------------------------------
    const vHeight = window.innerHeight || 800;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const isDesktop = typeof window !== "undefined" && window.innerWidth > 1024;

    // -------------------------------------------------------------
    // Multi-Section Lanyard Positioning:
    // 1. Landing: Normal size in Center (targetX = 0, targetZ = 13, targetY = 0)
    // 2. About Me: Zoomed on Left (targetX = 0.88, targetZ = 5.6, targetY = 0.28)
    // 3. What I Do: Normal size in Center (targetX = 0, targetZ = 13, targetY = 0)
    // 4. Past What I Do: Flies upwards and exits cleanly
    // -------------------------------------------------------------
    const vHeight = window.innerHeight || 800;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const isDesktop = typeof window !== "undefined" && window.innerWidth > 1024;

    const smoothstep = (min: number, max: number, val: number) => {
      const p = Math.min(1, Math.max(0, (val - min) / (max - min)));
      return p * p * (3 - 2 * p);
    };

    // Transition from Landing into About Me (zoom in & glide left)
    const toAboutProgress = smoothstep(vHeight * 0.25, vHeight * 0.75, scrollY);

    // Transition from About Me into What I Do (unzoom & return to center)
    const toWhatIDoProgress = smoothstep(vHeight * 1.25, vHeight * 1.80, scrollY);

    // Exit upwards after What I Do (scrollY from 2.40 * vHeight to 2.80 * vHeight)
    const exitUpProgress = smoothstep(vHeight * 2.40, vHeight * 2.80, scrollY);

    // In About Me, aboutFactor = 1; in Landing and What I Do, aboutFactor = 0.
    const aboutFactor = toAboutProgress * (1 - toWhatIDoProgress);

    const targetX = isDesktop ? THREE.MathUtils.lerp(0, 0.88, aboutFactor) : 0;
    const baseTargetY = THREE.MathUtils.lerp(0, 0.28, aboutFactor);
    const targetY = isDesktop ? baseTargetY - (exitUpProgress * 9.5) : baseTargetY;
    const targetZ = THREE.MathUtils.lerp(13, 5.6, aboutFactor);

    // Fade out after What I Do
    let opacity = 1;
    if (isDesktop) {
      if (exitUpProgress > 0.4) {
        opacity = Math.max(0, 1 - (exitUpProgress - 0.4) / 0.5);
      }
    } else {
      if (scrollY > vHeight * 0.65) {
        opacity = Math.max(0, 1 - (scrollY - vHeight * 0.65) / (vHeight * 0.3));
      }
    }

    if (wrapperRef?.current) {
      if (opacity <= 0.001) {
        wrapperRef.current.style.display = "none";
      } else {
        wrapperRef.current.style.display = "flex";
      }
      wrapperRef.current.style.opacity = opacity.toFixed(3);
      wrapperRef.current.style.pointerEvents =
        opacity > 0.05 && exitUpProgress < 0.5 ? "auto" : "none";
    }

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 5.5, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 6.0, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 5.5, delta);

    // Look straight forward at target plane for zero perspective distortion
    state.camera.lookAt(state.camera.position.x, targetY, 0);

    // Unified physics stabilization & alignment:
    if (card.current && !dragged) {
      const curRot = card.current.rotation() as any;
      quat.set(curRot.x, curRot.y, curRot.z, curRot.w);
      euler.setFromQuaternion(quat, "YXZ");

      let yaw = euler.y;
      while (yaw > Math.PI) yaw -= Math.PI * 2;
      while (yaw < -Math.PI) yaw += Math.PI * 2;

      let pitch = euler.x;
      while (pitch > Math.PI) pitch -= Math.PI * 2;
      while (pitch < -Math.PI) pitch += Math.PI * 2;

      let roll = euler.z;
      while (roll > Math.PI) roll -= Math.PI * 2;
      while (roll < -Math.PI) roll += Math.PI * 2;

      // Adjust dynamic damping in Rapier based on zoom level:
      // Freely swings in hero and What I Do (damping = 2.0), settles naturally when zoomed in About Me (damping = 4.8)
      card.current.setAngularDamping(2.0 + aboutFactor * 2.8);
      card.current.setLinearDamping(2.0 + aboutFactor * 1.8);

      // Target angular velocity to keep card stable and upright:
      const targetAngX = -pitch * (2.2 * aboutFactor);
      const targetAngY = -yaw * (0.6 + 3.2 * aboutFactor);
      const targetAngZ = -roll * (2.2 * aboutFactor);

      const curAng = card.current.angvel() as any;
      const dampSpeed = 3.5 + aboutFactor * 3.5;

      card.current.setAngvel(
        {
          x: THREE.MathUtils.damp(curAng.x, targetAngX, dampSpeed, delta),
          y: THREE.MathUtils.damp(curAng.y, targetAngY, dampSpeed, delta),
          z: THREE.MathUtils.damp(curAng.z, targetAngZ, dampSpeed, delta),
        },
        false
      );
    }
  });

  curve.curveType = "chordal";
  ribbonTexture.wrapS = ribbonTexture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4.6, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.01, -1, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.02, -2, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.01, -3, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody
          position={[0, -4.45, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.35 * cardScale, 0.5 * cardScale, 0.01]} />
          <group
            scale={cardScale}
            position={[0, -cardScale * 0.555, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              (e.target as Element)?.releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              (e.target as Element)?.setPointerCapture(e.pointerId);
              if (card.current) {
                const trans: any = card.current.translation();
                drag(
                  new THREE.Vector3()
                    .copy(e.point)
                    .sub(vec.set(trans.x, trans.y, trans.z))
                );
              }
            }}
          >
            {/* Card Mesh with Dynamic Texture */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                key={textureVersion}
                map={cardTexture || materials.base?.map}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.4}
              />
            </mesh>

            {/* Clips and Clamp */}
            {nodes.clip && (
              <mesh
                geometry={nodes.clip.geometry}
                material={materials.metal}
                material-roughness={0.3}
              />
            )}
            {nodes.clamp && (
              <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
            )}
          </group>
        </RigidBody>
      </group>

      {/* Ribbon Band */}
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="#d8b4fe"
          depthTest={false}
          resolution={new THREE.Vector2(2, 1)}
          useMap={1}
          map={ribbonTexture}
          repeat={new THREE.Vector2(-3, 1)}
          lineWidth={1.2}
        />
      </mesh>
    </>
  );
}
