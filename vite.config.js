import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Local dev: /api isteklerini Python'a ilet (vercel dev çalışırken)
      // Yoksa düz browser fetch kullanılır
    },
  },
});
