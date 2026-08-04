import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { dataRuntimeCache, productImageRuntimeCache, pwaGlobIgnores } from "./src/pwa.ts";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg"],
      manifest: {
        name: "镜见｜AI眼镜产品与技术",
        short_name: "镜见",
        lang: "zh-CN",
        description: "AI 眼镜每日情报、产品档案与学习路线",
        theme_color: "#000000",
        background_color: "#f5f5f3",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,json,jpg,png,webp}"],
        globIgnores: pwaGlobIgnores,
        runtimeCaching: [dataRuntimeCache, productImageRuntimeCache]
      }
    })
  ]
});
