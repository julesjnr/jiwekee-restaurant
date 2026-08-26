import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";
import { logAudit } from "./auth.js";

const router = Router();

// GET /api/tables — list all restaurant tables from database
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.table_number,
        t.capacity,
        t.status,
        t.section,
        t.created_at,
        t.updated_at,
        (
          SELECT json_build_object(
            'id', o.id,
            'user_name', u.name,
            'amount', o.amount::float,
            'fulfillment_status', o.fulfillment_status,
            'status', o.status,
            'created_at', o.created_at
          )
          FROM orders o
          JOIN users u ON o.user_id = u.id
          WHERE o.table_number = t.table_number
            AND o.fulfillment_status NOT IN ('Completed', 'Cancelled')
          ORDER BY o.created_at DESC
          LIMIT 1
        ) AS "activeOrder"
      FROM restaurant_tables t
      ORDER BY t.id ASC
    `);

    res.json({ tables: result.rows });
  } catch (err) {
    console.error("Fetch tables error:", err);
    res.status(500).json({ error: "Could not load tables from database." });
  }
});

// POST /api/tables — staff creates table in PostgreSQL
router.post("/", requireStaff, async (req, res) => {
  const { table_number, capacity, section, status } = req.body;
  if (!table_number) {
    return res.status(400).json({ error: "Table number is required." });
  }

  try {
    const checkRes = await pool.query(
      "SELECT id FROM restaurant_tables WHERE LOWER(table_number) = LOWER($1)",
      [table_number.trim()]
    );
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: `Table ${table_number} already exists.` });
    }

    const insertRes = await pool.query(
      `INSERT INTO restaurant_tables (table_number, capacity, section, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, table_number, capacity, section, status, created_at, updated_at`,
      [
        table_number.trim(),
        Number(capacity) || 4,
        section ? section.trim() : "Main Dining",
        status || "Available",
      ]
    );

    const newTable = insertRes.rows[0];

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "TABLE_CREATED",
      entity: "restaurant_tables",
      entityId: newTable.id,
      details: `Added new table ${newTable.table_number} (Capacity: ${newTable.capacity}, ${newTable.section})`,
    });

    res.status(201).json({ table: { ...newTable, activeOrder: null } });
  } catch (err) {
    console.error("Create table error:", err);
    res.status(500).json({ error: "Failed to create table." });
  }
});

// PATCH /api/tables/:id/status — update table status in PostgreSQL
router.patch("/:id/status", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM restaurant_tables WHERE id = $1",
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Table not found." });
    }

    const prev = existing.rows[0];

    const updateRes = await pool.query(
      "UPDATE restaurant_tables SET status = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [status, id]
    );

    const table = updateRes.rows[0];

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "TABLE_STATUS_CHANGED",
      entity: "restaurant_tables",
      entityId: table.id,
      details: `Table ${table.table_number} status changed from '${prev.status}' to '${status}'`,
    });

    res.json({ table });
  } catch (err) {
    console.error("Update table error:", err);
    res.status(500).json({ error: "Failed to update table status." });
  }
});

// DELETE /api/tables/:id — delete table from PostgreSQL
router.delete("/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const deleteRes = await pool.query(
      "DELETE FROM restaurant_tables WHERE id = $1 RETURNING *",
      [id]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: "Table not found." });
    }

    const deleted = deleteRes.rows[0];

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "TABLE_DELETED",
      entity: "restaurant_tables",
      entityId: deleted.id,
      details: `Removed table ${deleted.table_number}`,
    });

    res.json({ ok: true, table: deleted });
  } catch (err) {
    console.error("Delete table error:", err);
    res.status(500).json({ error: "Failed to delete table." });
  }
});

export default router;
