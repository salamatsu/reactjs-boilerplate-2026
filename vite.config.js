import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// Scan2Win — Vite build configuration
// Dev server port: 3045, with API proxy to VITE_BASEURL
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 3045,
      proxy: {
        "/api/scans": {
          target: env.VITE_BASEURL_APP,
          changeOrigin: true,
        },
        "/api": {
          target: env.VITE_BASEURL,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ""), // /api will be removed when proxying to the target
        },
        "/public": {
          target: env.VITE_BASEURL,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/public/, ""), // /public will be removed when proxying to the target
        },
      },
    },
  };
});
