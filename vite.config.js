import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ["/public/*", "/src/server/*"],
    },
    port: 5174, // ✅ Avoid 3000/7000
    open: true,
    middlewareMode: false, // full dev server
  },
  build: {
    outDir: "dist",
  },
});
