import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

import authRoutes from "./server/src/routes/auth.js";
import menuRoutes from "./server/src/routes/menu.js";
import ordersRoutes from "./server/src/routes/orders.js";
import mpesaRoutes from "./server/src/routes/mpesa.js";
import kdsRoutes from "./server/src/routes/kds.js";
import tablesRoutes from "./server/src/routes/tables.js";
import reservationsRoutes from "./server/src/routes/reservations.js";
import inventoryRoutes from "./server/src/routes/inventory.js";
import crmRoutes from "./server/src/routes/crm.js";
import reconciliationRoutes from "./server/src/routes/reconciliation.js";
import reportsRoutes from "./server/src/routes/reports.js";
import statsRoutes from "./server/src/routes/stats.js";
import paymentsRoutes from "./server/src/routes/payments.js";
import walletRoutes from "./server/src/routes/wallet.js";
import notificationsRoutes from "./server/src/routes/notifications.js";
import auditRoutes from "./server/src/routes/audit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // API Routes (100% Database Driven)
  app.use("/api/auth", authRoutes);
  app.use("/api/users", authRoutes); // Compatibility alias for /api/users/me
  app.use("/api/wallet", walletRoutes);
  app.use("/api/menu", menuRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/mpesa", mpesaRoutes);
  app.use("/api/kds", kdsRoutes);
  app.use("/api/tables", tablesRoutes);
  app.use("/api/reservations", reservationsRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/crm", crmRoutes);
  app.use("/api/reconciliation", reconciliationRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/audit-logs", auditRoutes);

  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, timestamp: new Date().toISOString() })
  );

  // Serve static uploads directory for user-uploaded dish images
  const uploadsDir = path.resolve(__dirname, "./uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Development: Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(__dirname, "./client"),
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve compiled static files
    const distPath = path.resolve(__dirname, "./dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler
  app.use((err, _req, res, _next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jiwekee Restaurant running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
