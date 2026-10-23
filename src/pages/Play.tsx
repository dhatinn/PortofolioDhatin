import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import "./Play.css";

// --- CONFIG ---
const CONFIG = {
  laneWidth: 2.5,
  cameraOffset: { x: 0, y: 7, z: 10 },
  gravity: 0.015,
  jumpPower: 0.35,
  baseSpeed: 0.2,
  speedInc: 0.0001,
  floorLength: 400,
  fogDensity: 0.02,
};

// --- THEMES ---
const THEMES = [
  {
    name: "Candy",
    sky: 0xffd1dc,
    ground: 0xfff0f5,
    obstacle: 0xff6b6b,
    decor: 0x98fb98,
  },
  {
    name: "Neon",
    sky: 0x1a1a2e,
    ground: 0x16213e,
    obstacle: 0xe94560,
    decor: 0x0f3460,
  },
  {
    name: "Sunset",
    sky: 0xff9a8b,
    ground: 0xff6a88,
    obstacle: 0x2c3e50,
    decor: 0xf9ca24,
  },
  {
    name: "Mint",
    sky: 0xe0f7fa,
    ground: 0xffffff,
    obstacle: 0x009688,
    decor: 0x80cbc4,
  },
  {
    name: "Midnight",
    sky: 0x000000,
    ground: 0x222222,
    obstacle: 0xffff00,
    decor: 0x444444,
  },
];

interface WorldObject {
  mesh: THREE.Object3D;
  type: "obstacle" | "decor";
  lane?: number;
  passed?: boolean;
}

const Play = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  // Game internal state ref
  const gameStateRef = useRef({
    isPlaying: false,
    score: 0,
    speed: CONFIG.baseSpeed,
    lane: 0,
    currentLaneX: 0,
    isJumping: false,
    jumpVel: 0,
    playerY: 0,
    theme: THEMES[0],
    spawnTimer: 0,
  });

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    player: THREE.Group | null;
    floorGroups: THREE.Object3D[];
    worldObjects: WorldObject[];
    animId: number | null;
  } | null>(null);

  // Pick a random theme
  const randomTheme = useCallback(() => {
    return THEMES[Math.floor(Math.random() * THEMES.length)];
  }, []);

  // Create cute animal player
  const createPlayer = useCallback((themeSky: number) => {
    const group = new THREE.Group();

    // Random Animal Colors
    const animalColors = [0xffffff, 0xaaaaaa, 0xffcc99, 0x333333];
    const color = animalColors[Math.floor(Math.random() * animalColors.length)];

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      flatShading: true,
    });

    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.05);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.6, 0.5);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.6, 0.5);
    group.add(rightEye);

    // Ears (Random Shape: 0 = Bunny, 1 = Bear, 2 = Cat)
    const earType = Math.floor(Math.random() * 3);
    const earGeo =
      earType === 0
        ? new THREE.BoxGeometry(0.2, 0.5, 0.2) // Bunny
        : earType === 1
        ? new THREE.BoxGeometry(0.3, 0.3, 0.1) // Bear
        : new THREE.ConeGeometry(0.2, 0.4, 4); // Cat

    const leftEar = new THREE.Mesh(earGeo, mat);
    leftEar.position.set(-0.3, 1.1, 0);
    if (earType !== 2) leftEar.castShadow = true;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, mat);
    rightEar.position.set(0.3, 1.1, 0);
    if (earType !== 2) rightEar.castShadow = true;
    group.add(rightEar);

    // Unused param warning avoidance
    if (themeSky < 0) console.log(themeSky);

    return group;
  }, []);

  // Obstacle mesh
  const createObstacleMesh = useCallback((obstacleColor: number) => {
    const type = Math.floor(Math.random() * 3);
    const geo =
      type === 0
        ? new THREE.ConeGeometry(0.5, 1, 6)
        : type === 1
        ? new THREE.BoxGeometry(1, 1, 1)
        : new THREE.CylinderGeometry(0.5, 0.5, 1, 6);

    const mat = new THREE.MeshStandardMaterial({
      color: obstacleColor,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }, []);

  // Tree / Pillar decoration
  const createDecorationMesh = useCallback((decorColor: number) => {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      flatShading: true,
    });
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 5);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    group.add(trunk);

    const leavesMat = new THREE.MeshStandardMaterial({
      color: decorColor,
      flatShading: true,
    });
    const leavesGeo = new THREE.DodecahedronGeometry(0.8);
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 1.8;
    leaves.castShadow = true;
    group.add(leaves);

    return group;
  }, []);

  // Spawn row of world objects
  const spawnRow = useCallback(() => {
    const t = threeRef.current;
    if (!t) return;
    const zStart = -60;
    const theme = gameStateRef.current.theme;

    // Left Decor
    if (Math.random() > 0.3) {
      const dL = createDecorationMesh(theme.decor);
      dL.position.set(-5 - Math.random() * 5, 0, zStart);
      t.scene.add(dL);
      t.worldObjects.push({ mesh: dL, type: "decor" });
    }

    // Right Decor
    if (Math.random() > 0.3) {
      const dR = createDecorationMesh(theme.decor);
      dR.position.set(5 + Math.random() * 5, 0, zStart);
      t.scene.add(dR);
      t.worldObjects.push({ mesh: dR, type: "decor" });
    }

    // Obstacle
    if (Math.random() > 0.3) {
      const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const obs = createObstacleMesh(theme.obstacle);
      obs.position.set(lane * CONFIG.laneWidth, 0.5, zStart);
      t.scene.add(obs);
      t.worldObjects.push({ mesh: obs, type: "obstacle", lane: lane, passed: false });
    }
  }, [createDecorationMesh, createObstacleMesh]);

  // Game Over trigger
  const gameOver = useCallback(() => {
    gameStateRef.current.isPlaying = false;
    const finalVal = Math.floor(gameStateRef.current.score);
    setFinalScore(finalVal);
    setScreen("gameover");
  }, []);

  // Animation Loop
  const animate = useCallback(() => {
    const t = threeRef.current;
    const g = gameStateRef.current;
    if (!t || !g.isPlaying) return;

    t.animId = requestAnimationFrame(animate);

    // Update score and speed
    g.score += g.speed;
    g.speed += CONFIG.speedInc;
    setScore(Math.floor(g.score));

    // Player Movement (Lane Lerp)
    const targetX = g.lane * CONFIG.laneWidth;
    g.currentLaneX += (targetX - g.currentLaneX) * 0.15;
    if (t.player) {
      t.player.position.x = g.currentLaneX;

      // Player Jump Physics
      if (g.isJumping) {
        g.playerY += g.jumpVel;
        g.jumpVel -= CONFIG.gravity;
        if (g.playerY <= 0) {
          g.playerY = 0;
          g.isJumping = false;
        }
      } else {
        // Run Bounce
        g.playerY = Math.abs(Math.sin(Date.now() * 0.015)) * 0.1;
      }
      t.player.position.y = g.playerY + 0.5;

      // Rotation Tilt
      t.player.rotation.z = (g.currentLaneX - t.player.position.x) * -0.1;
      t.player.rotation.x = g.isJumping ? -0.2 : 0;
    }

    // Spawn World
    g.spawnTimer += g.speed;
    if (g.spawnTimer > 3) {
      spawnRow();
      g.spawnTimer = 0;
    }

    // Move World Objects
    for (let i = t.worldObjects.length - 1; i >= 0; i--) {
      const obj = t.worldObjects[i];
      obj.mesh.position.z += g.speed * 2;

      // Collision Detection
      if (obj.type === "obstacle" && t.player) {
        if (obj.mesh.position.z > -0.8 && obj.mesh.position.z < 0.8) {
          const dx = Math.abs(t.player.position.x - obj.mesh.position.x);
          const dy = Math.abs(t.player.position.y - obj.mesh.position.y);
          if (dx < 0.8 && dy < 0.8) {
            gameOver();
            return;
          }
        }
      }

      // Cleanup past camera
      if (obj.mesh.position.z > 10) {
        t.scene.remove(obj.mesh);
        t.worldObjects.splice(i, 1);
      }
    }

    t.renderer.render(t.scene, t.camera);
  }, [spawnRow, gameOver]);

  // Start / Restart Game
  const startGame = useCallback(() => {
    const t = threeRef.current;
    if (!t) return;

    const theme = randomTheme();

    gameStateRef.current = {
      isPlaying: true,
      score: 0,
      speed: CONFIG.baseSpeed,
      lane: 0,
      currentLaneX: 0,
      isJumping: false,
      jumpVel: 0,
      playerY: 0,
      theme,
      spawnTimer: 0,
    };

    setScore(0);
    setScreen("playing");

    // Background & Fog
    t.scene.background = new THREE.Color(theme.sky);
    t.scene.fog = new THREE.Fog(theme.sky, 10, 50);

    // Clean old floor
    t.floorGroups.forEach((f) => t.scene.remove(f));
    t.floorGroups = [];

    // Infinite Floor Plane
    const planeGeo = new THREE.PlaneGeometry(100, 200);
    const planeMat = new THREE.MeshStandardMaterial({
      color: theme.ground,
      roughness: 1,
      flatShading: true,
    });
    const floor = new THREE.Mesh(planeGeo, planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -50;
    floor.receiveShadow = true;
    t.scene.add(floor);
    t.floorGroups.push(floor);

    // Grid Helper
    const grid = new THREE.GridHelper(200, 100, 0xffffff, 0xffffff);
    grid.position.y = 0.01;
    grid.position.z = -50;
    const gridMat = grid.material as THREE.Material;
    gridMat.opacity = 0.1;
    gridMat.transparent = true;
    t.scene.add(grid);
    t.floorGroups.push(grid);

    // Player
    if (t.player) {
      t.scene.remove(t.player);
    }
    const newPlayer = createPlayer(theme.sky);
    newPlayer.position.set(0, 0, 0);
    t.scene.add(newPlayer);
    t.player = newPlayer;

    // Clear old objects
    t.worldObjects.forEach((obj) => t.scene.remove(obj.mesh));
    t.worldObjects = [];

    // Start Animation Loop
    if (t.animId) cancelAnimationFrame(t.animId);
    animate();
  }, [randomTheme, createPlayer, animate]);

  // Touch / Action controls
  const moveLeft = useCallback(() => {
    if (!gameStateRef.current.isPlaying) return;
    if (gameStateRef.current.lane > -1) gameStateRef.current.lane--;
  }, []);

  const moveRight = useCallback(() => {
    if (!gameStateRef.current.isPlaying) return;
    if (gameStateRef.current.lane < 1) gameStateRef.current.lane++;
  }, []);

  const jump = useCallback(() => {
    if (!gameStateRef.current.isPlaying) return;
    if (!gameStateRef.current.isJumping) {
      gameStateRef.current.isJumping = true;
      gameStateRef.current.jumpVel = CONFIG.jumpPower;
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStateRef.current.isPlaying) {
        if (e.code === "Space" || e.code === "Enter") {
          startGame();
        }
        return;
      }

      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        moveLeft();
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        moveRight();
      } else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startGame, moveLeft, moveRight, jump]);

  // Initialize Three.js on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(
      CONFIG.cameraOffset.x,
      CONFIG.cameraOffset.y,
      CONFIG.cameraOffset.z
    );
    camera.lookAt(0, 0, -5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    threeRef.current = {
      scene,
      camera,
      renderer,
      player: null,
      floorGroups: [],
      worldObjects: [],
      animId: null,
    };

    // Initial render
    renderer.render(scene, camera);

    // Resize handler
    const handleResize = () => {
      if (!threeRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (threeRef.current?.animId) {
        cancelAnimationFrame(threeRef.current.animId);
      }
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="hopper-game-root">
      {/* 3D Canvas Container */}
      <div id="game-container" ref={containerRef}></div>

      {/* UI Overlay */}
      <div id="ui-layer">
        {/* Score Display */}
        <div id="score-display" className={screen === "playing" ? "" : "hidden"}>
          SCORE: <span id="score">{score}</span>
        </div>

        {/* Instructions */}
        <div id="instructions">
          STEPS:
          <br />
          <span className="key">←</span> <span className="key">→</span> MOVE
          <br />
          <span className="key">↑</span> JUMP
        </div>

        {/* Start Screen */}
        {screen === "start" && (
          <div id="start-screen" className="center-screen">
            <h1 className="title">SUPER HOPPER</h1>
            <p className="subtitle">MY CUTE ADVENTURE</p>
            <button id="start-btn" onClick={startGame}>
              PRESS START
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {screen === "gameover" && (
          <div id="game-over-screen" className="center-screen">
            <h1 className="title">GAME OVER</h1>
            <p className="subtitle">
              SCORE: <span id="final-score">{finalScore}</span>
            </p>
            <button id="restart-btn" onClick={startGame}>
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Mobile On-Screen Touch Controls */}
        <div className="mobile-controls">
          <button className="touch-btn" onClick={moveLeft} aria-label="Move Left">
            ←
          </button>
          <button className="touch-btn" onClick={moveRight} aria-label="Move Right">
            →
          </button>
          <button className="touch-btn touch-btn-jump" onClick={jump} aria-label="Jump">
            ↑
          </button>
        </div>

        {/* Back Navigation to Main Portfolio */}
        <Link to="/" className="back-to-portfolio" title="Return to main portfolio">
          ← Back to Portfolio
        </Link>
      </div>
    </div>
  );
};

export default Play;
