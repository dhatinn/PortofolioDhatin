import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Restrict dev server to localhost — prevents LAN exposure in dev
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Vite 8 / Rollup 4: use function syntax for manualChunks
        manualChunks(id) {
          if (id.includes("node_modules/three") || id.includes("node_modules/three-stdlib")) {
            return "three";
          }
          if (
            id.includes("node_modules/@react-three/fiber") ||
            id.includes("node_modules/@react-three/drei") ||
            id.includes("node_modules/@react-three/postprocessing") ||
            id.includes("node_modules/@react-three/rapier") ||
            id.includes("node_modules/@react-three/cannon")
          ) {
            return "react-three";
          }
          if (id.includes("node_modules/gsap")) {
            return "gsap";
          }
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/")
          ) {
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ["three", "gsap", "lenis"],
  },
});


