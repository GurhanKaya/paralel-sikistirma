import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { spawn } from "node:child_process";

// Lokal dev: `npm run dev` ile birlikte Python backend'i (api/devserver.py)
// otomatik baslatir. Ayri terminal acmaya gerek yok.
function pythonBackend() {
  let proc = null;
  return {
    name: "python-backend",
    apply: "serve",
    configureServer(server) {
      const py = process.platform === "win32" ? "python" : "python3";
      proc = spawn(py, ["api/devserver.py"], { stdio: "inherit" });
      proc.on("error", (e) =>
        server.config.logger.error(`[backend] Python baslatilamadi: ${e.message}`)
      );
      const stop = () => {
        if (proc && !proc.killed) proc.kill();
      };
      server.httpServer?.once("close", stop);
      process.once("exit", stop);
      process.once("SIGINT", () => { stop(); process.exit(0); });
      process.once("SIGTERM", () => { stop(); process.exit(0); });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pythonBackend()],
  server: {
    proxy: {
      // /api isteklerini Python dev sunucusuna ilet.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        configure: (proxy) => {
          // Backend hazir degilse tarayiciya anlasilir JSON dondur.
          proxy.on("error", (_err, _req, res) => {
            if (res && !res.headersSent && res.writeHead) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Backend'e ulasilamadi (python api/devserver.py calisiyor mu?)" }));
            }
          });
        },
      },
    },
  },
});
