import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();

// GET /api/audit-logs — staff audit trail from PostgreSQL
router.get("/", requireStaff, async (req, res) => {
  try {
    const { action, entity, search } = req.query;

    const conditions = [];
    const params = [];

    if (action) {
      params.push(action.trim().toLowerCase());
      conditions.push("LOWER(action) = $" + params.length);
    }
    if (entity) {
      params.push(entity.trim().toLowerCase());
      conditions.push("LOWER(entity) = $" + params.length);
    }
    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(COALESCE(user_name, '')) LIKE $${idx} OR LOWER(COALESCE(details, '')) LIKE $${idx} OR LOWER(COALESCE(action, '')) LIKE $${idx})`
      );
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const query = `
      SELECT *
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 200
    `;

    const result = await pool.query(query, params);
    res.json({ logs: result.rows });
  } catch (err) {
    console.error("Fetch audit logs error:", err);
    res.status(500).json({ error: "Failed to load audit logs from database." });
  }
});

export default router;
