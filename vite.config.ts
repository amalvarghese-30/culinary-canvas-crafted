import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { imagetools } from "vite-imagetools";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    imagetools({ removeMetadata: true }),
    {
      name: "hero-preload",
      apply: "build",
      enforce: "post",
      generateBundle(_, bundle) {
        const heroAssets = Object.entries(bundle)
          .filter(
            ([name]) => name.includes("hero-momos") && name.endsWith(".avif"),
          )
          .sort((a, b) => {
            const sizeA = (a[1] as any).source?.length ?? 0;
            const sizeB = (b[1] as any).source?.length ?? 0;
            return sizeB - sizeA;
          });
        const largest = heroAssets[0];
        const htmlKey = Object.keys(bundle).find((k) => k.endsWith("index.html"));
        if (htmlKey && largest) {
          const htmlChunk = bundle[htmlKey];
          if (htmlChunk.type === "asset") {
            htmlChunk.source = (htmlChunk.source as string).replace(
              "</head>",
              `  <link rel="preload" as="image" href="/${largest[0]}" imagesizes="100vw" fetchpriority="high">\n  </head>`,
            );
          }
        }
      },
    },
  ],
  resolve: {
    alias: { "@": "/src" },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-ui";
          }
        },
      },
    },
  },
});
