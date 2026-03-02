import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 3045,
      proxy: {
        "/api": {
          target: env.VITE_BASEURL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""), // /api will be removed when proxying to the target
        },
        "/public": {
          target: env.VITE_BASEURL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/public/, ""), // /public will be removed when proxying to the target
        },
      },
    },
  };
});
