import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.wasm", "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.webp", "**/*.gif", "**/*.svg"],
  server: {
    proxy: {
      "/zama-worker": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/zama-worker/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
