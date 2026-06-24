import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { imagetools } from "vite-imagetools";

export default defineConfig({
  plugins: [react(), tailwindcss(), imagetools({ removeMetadata: true })],
  resolve: {
    alias: { "@": "/src" },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
