import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import Band from "./Band";
import "./Lanyard.css";

import { usePortfolio } from "../../context/PortfolioContext";

// Preload assets for instantaneous mounting
useGLTF.preload("/assets/3d/card.glb");
useTexture.preload("/assets/images/tag_texture.png");

const LanyardCanvas: React.FC = () => {
  const { profile, config } = usePortfolio();
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="lanyard-wrapper" ref={wrapperRef} data-cursor="disable">
      <Canvas
        camera={{ position: [0, 0, 13], fov: 25 }}
        style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={Math.PI * 0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <Suspense fallback={null}>
          <Physics
            debug={false}
            interpolate
            gravity={[0, -40, 0]}
            timeStep={1 / 60}
          >
            <Band profile={profile} config={config} wrapperRef={wrapperRef} />
          </Physics>

          <Environment blur={0.75}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="#ff7a00"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={8}
              color="#ffedd5"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default LanyardCanvas;
