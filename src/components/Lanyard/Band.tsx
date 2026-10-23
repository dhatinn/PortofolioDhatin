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
  canSleep: false,
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

  const dir = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);

  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  const { nodes, materials } = useGLTF("/assets/3d/card.glb") as any;
  const ribbonTexture = useTexture("/assets/images/tag_texture.png");

  // Dynamic canvas texture for card based on Admin config
  const [cardTexture, setCardTexture] = useState<THREE.CanvasTexture | null>(null);
  const [textureVersion, setTextureVersion] = useState(0);

  useEffect(() => {
    const photo = profile?.badge?.photo || profile?.photo || config.developer.photo || "/images/lanyard_photo.jpg";
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
    profile?.badge?.photo,
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
    [0, 1.405, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
    return () => void (document.body.style.cursor = "auto");
  }, [hovered, dragged]);

  useEffect(() => {
    const handleGlobalPointerUp = () => drag(false);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, []);

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
      // Ray-plane intersection with z = 0 plane for exact, direct cursor tracking
      dir.set(state.pointer.x, state.pointer.y, 0.5)
        .unproject(state.camera)
        .sub(state.camera.position)
        .normalize();

      const denom = Math.abs(dir.z) > 0.0001 ? dir.z : -0.0001;
      const t = -state.camera.position.z / denom;
      const hitX = state.camera.position.x + dir.x * t;
      const hitY = state.camera.position.y + dir.y * t;

      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: hitX - dragged.x,
        y: hitY - dragged.y,
        z: 0,
      });
    }

    if (fixed.current && card.current) {
      const cardTrans = card.current.translation() as any;
      const cardRot = card.current.rotation() as any;
      quat.set(cardRot.x, cardRot.y, cardRot.z, cardRot.w);

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

      // Anchor the bottom of the ribbon line directly into the clip loop
      const clipAttach = new THREE.Vector3(0, 1.405, 0)
        .applyQuaternion(quat)
        .add(new THREE.Vector3(cardTrans.x, cardTrans.y, cardTrans.z));

      curve.points[0].copy(clipAttach);
      curve.points[1].copy(j2Lerped ?? (j2.current.translation() as any));
      curve.points[2].copy(j1Lerped ?? (j1.current.translation() as any));
      curve.points[3].copy(fixed.current.translation() as any);
      // Natural band curve tracking
      band.current.geometry.setPoints(curve.getPoints(32));
    }


    // -------------------------------------------------------------
    // Multi-Section Lanyard Positioning & Visibility:
    // 1. Landing / Hero: Completely HIDDEN (opacity = 0)
    // 2. About Me: Zoomed on Left (targetX = 0.88, targetZ = 5.6, targetY = 0.28)
    // 3. What I Do: Normal size in Center (targetX = 0, targetZ = 13, targetY = 0)
    //    Dynamic left-right interactive motion via cursor sway & physics drag
    // 4. Past What I Do: Flies upwards and exits cleanly
    // -------------------------------------------------------------
    const vHeight = window.innerHeight || 800;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const isDesktop = typeof window !== "undefined" && window.innerWidth > 1024;

    const smoothstep = (min: number, max: number, val: number) => {
      const p = Math.min(1, Math.max(0, (val - min) / (max - min)));
      return p * p * (3 - 2 * p);
    };

    // Transition from Landing/Hero into About Me (zoom in & glide left)
    // In Hero (scrollY < 0.35 * vHeight), toAboutProgress is 0 -> Lanyard is 100% hidden
    const toAboutProgress = smoothstep(vHeight * 0.35, vHeight * 0.85, scrollY);

    // Transition from About Me into What I Do (unzoom & return to center)
    const toWhatIDoProgress = smoothstep(vHeight * 1.25, vHeight * 1.80, scrollY);

    // Exit upwards after What I Do (scrollY from 2.95 * vHeight to 3.45 * vHeight)
    // Stays 100% active and interactive throughout the entire What I Do section
    const exitUpProgress = smoothstep(vHeight * 2.95, vHeight * 3.45, scrollY);

    // In About Me, aboutFactor = 1; in What I Do, whatIDoFactor = 1.
    const aboutFactor = toAboutProgress * (1 - toWhatIDoProgress);
    const whatIDoFactor = toWhatIDoProgress * (1 - exitUpProgress);

    // About Me Zoom: Moderated zoom (targetZ = 8.0 instead of 5.6) for elegant framing with comfortable margins
    const targetX = isDesktop ? THREE.MathUtils.lerp(0, 1.25, aboutFactor) : 0;
    const baseTargetY = THREE.MathUtils.lerp(0, 0.35, aboutFactor);
    const targetY = isDesktop ? baseTargetY - (exitUpProgress * 9.5) : baseTargetY;
    const targetZ = THREE.MathUtils.lerp(13, 8.0, aboutFactor);

    // Lanyard Visibility:
    // - Hero (scrollY < 0.35 * vHeight): opacity = 0 (completely hidden)
    // - About Me & What I Do: opacity = 1 (visible)
    // - Past What I Do: fades out as it flies upwards
    let opacity = 0;
    if (isDesktop) {
      opacity = toAboutProgress;
      if (exitUpProgress > 0.15) {
        opacity = Math.max(0, (1 - (exitUpProgress - 0.15) / 0.6) * toAboutProgress);
      }
    } else {
      opacity = 0; // Hidden on mobile
    }

    if (wrapperRef?.current) {
      if (opacity <= 0.005) {
        wrapperRef.current.style.opacity = "0";
        wrapperRef.current.style.visibility = "hidden";
        wrapperRef.current.style.pointerEvents = "none";
      } else {
        wrapperRef.current.style.visibility = "visible";
        wrapperRef.current.style.opacity = opacity.toFixed(3);
        wrapperRef.current.style.pointerEvents =
          opacity > 0.1 && exitUpProgress < 0.5 ? "auto" : "none";
      }
    }

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 5.5, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 6.0, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 5.5, delta);

    // Look straight forward at target plane for zero perspective distortion
    state.camera.lookAt(state.camera.position.x, targetY, 0);

    // -------------------------------------------------------------
    // What I Do: Interactive Left & Right Sway / Physics Control
    // -------------------------------------------------------------
    if (whatIDoFactor > 0.15 && fixed.current && !dragged) {
      // Horizontal sway based on cursor pointer X (-1 on left to +1 on right)
      const swayTargetX = THREE.MathUtils.clamp(state.pointer.x * 2.2, -1.8, 1.8) * whatIDoFactor;
      const curFixed = fixed.current.translation() as any;
      fixed.current.setTranslation(
        {
          x: THREE.MathUtils.damp(curFixed.x, swayTargetX, 4.5, delta),
          y: 4.6,
          z: 0,
        },
        true
      );
      [card, j1, j2, j3].forEach((ref) => ref.current?.wakeUp());
    } else if (fixed.current && !dragged) {
      const curFixed = fixed.current.translation() as any;
      if (Math.abs(curFixed.x) > 0.005) {
        fixed.current.setTranslation(
          {
            x: THREE.MathUtils.damp(curFixed.x, 0, 4.5, delta),
            y: 4.6,
            z: 0,
          },
          true
        );
      }
    }

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

      // Adjust dynamic damping in Rapier based on section:
      // Freely swings in What I Do (damping = 1.6), settles calmly in About Me (damping = 4.8)
      card.current.setAngularDamping(1.6 + aboutFactor * 3.2);
      card.current.setLinearDamping(1.4 + aboutFactor * 2.4);

      // Target angular velocity to keep card stable and upright:
      const targetAngX = -pitch * (0.8 + 1.4 * aboutFactor);
      const targetAngY = -yaw * (0.8 + 3.0 * aboutFactor);
      const targetAngZ = -roll * (0.8 + 1.4 * aboutFactor);

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
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.25, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              (e.nativeEvent.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.nativeEvent.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
              if (card.current) {
                dir.set(e.pointer.x, e.pointer.y, 0.5)
                  .unproject(e.camera)
                  .sub(e.camera.position)
                  .normalize();
                const denom = Math.abs(dir.z) > 0.0001 ? dir.z : -0.0001;
                const t = -e.camera.position.z / denom;
                const hitX = e.camera.position.x + dir.x * t;
                const hitY = e.camera.position.y + dir.y * t;
                const trans: any = card.current.translation();
                drag(new THREE.Vector3(hitX - trans.x, hitY - trans.y, 0));
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
