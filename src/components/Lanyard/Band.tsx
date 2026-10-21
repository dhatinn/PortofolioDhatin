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
}

export default function Band({
  maxSpeed = 50,
  minSpeed = 10,
  profile: propProfile,
  config: propConfig,
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
    const accentColor = profile?.badge?.accentColor || "#a855f7";

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
      band.current.geometry.setPoints(curve.getPoints(32));

      ang.copy(card.current.angvel() as any);
      rot.copy(card.current.rotation() as any);
      card.current.setAngvel(
        { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
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
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody
          position={[2, 0, 0]}
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
