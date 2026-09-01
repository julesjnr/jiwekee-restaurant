import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import ordersRoutes from "./routes/orders.js";
import mpesaRoutes from "./routes/mpesa.js";
import kdsRoutes from "./routes/kds.js";
import tablesRoutes from "./routes/tables.js";
import reservationsRoutes from "./routes/reservations.js";
import inventoryRoutes from "./routes/inventory.js";
import crmRoutes from "./routes/crm.js";
import reconciliationRoutes from "./routes/reconciliation.js";
import reportsRoutes from "./routes/reports.js";
import statsRoutes from "./routes/stats.js";
import paymentsRoutes from "./routes/payments.js";
import walletRoutes from "./routes/wallet.js";
import notificationsRoutes from "./routes/notifications.js";
import auditRoutes from "./routes/audit.js";
import { pool } from "./db/pool.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
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

app.get("/api/health", async (_req, res) => {
  try {
    const dbCheck = await pool.query("SELECT 1 AS healthy, CURRENT_TIMESTAMP AS db_time");
    res.json({
      ok: true,
      database: dbCheck.rows[0]?.healthy === 1 ? "connected" : "degraded",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Health Check Error]", err.message);
    res.status(503).json({
      ok: false,
      database: "disconnected",
      error: "Database connectivity issue",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/health/database", async (_req, res) => {
  try {
    const dbCheck = await pool.query("SELECT 1 AS healthy, CURRENT_TIMESTAMP AS db_time");
    res.json({
      ok: true,
      database: dbCheck.rows[0]?.healthy === 1 ? "connected" : "degraded",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Database Health Error]", err.message);
    res.status(503).json({
      ok: false,
      database: "disconnected",
      error: "Unable to query PostgreSQL database",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Jiwekee API listening on port ${port}`));
