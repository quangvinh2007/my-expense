import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

import { app } from "./server/server.ts";
import { connectDB } from "./server/config/database.ts";
import { ENV } from "./server/config/env.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = ENV.PORT;
const HOST = "0.0.0.0";
const isProduction = ENV.NODE_ENV === "production";

async function startServer() {
  try {
    // 1. Connect database
    console.log("\n========================================");
    console.log("          MY EXPENSE SERVER");
    console.log("========================================");

    console.log("[SERVER] Đang kết nối database...");

    await connectDB();

    // 2. Configure frontend
    if (isProduction) {
      const distPath = path.resolve(__dirname, "dist");

      app.use(express.static(distPath));

      // Frontend SPA fallback
      app.get(/.*/, (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });

      console.log("[SERVER] Chế độ: Production");
      console.log("[SERVER] Frontend: dist/");
    } else {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== "true",
        },
        appType: "spa",
      });

      app.use(vite.middlewares);

      console.log("[SERVER] Chế độ: Development");
      console.log("[SERVER] Frontend: Vite");
    }

    // 3. Start HTTP server
    app.listen(PORT, HOST, () => {
      console.log("----------------------------------------");
      console.log("[SERVER] Khởi động thành công!");
      console.log(`[APP]     http://localhost:${PORT}`);
      console.log(`[APP]     http://127.0.0.1:${PORT}`);
      console.log(`[API]     http://localhost:${PORT}/api`);
      console.log(`[HEALTH]  http://localhost:${PORT}/api/health`);
      console.log("----------------------------------------");
      console.log("[SERVER] Đang chờ request...\n");
    });
  } catch (error) {
    console.error("\n[SERVER] Không thể khởi động ứng dụng:", error);
    process.exit(1);
  }
}

startServer();
