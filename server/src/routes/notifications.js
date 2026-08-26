import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();

// GET /api/notifications — staff view notifications from database
router.get("/", requireStaff, async (_req, res) => {
  try {
    const listRes = await pool.query(
      "SELECT * FROM system_notifications ORDER BY created_at DESC LIMIT 50"
    );
    const unreadRes = await pool.query(
      "SELECT COUNT(*)::int AS unread FROM system_notifications WHERE is_read = false"
    );

    res.json({
      notifications: listRes.rows,
      unreadCount: unreadRes.rows[0].unread,
    });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ error: "Failed to load notifications from database." });
  }
});

// PATCH /api/notifications/:id/read — mark notification read in PostgreSQL
router.patch("/:id/read", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      "UPDATE system_notifications SET is_read = true WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }

    res.json({ ok: true, notification: result.rows[0] });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// POST /api/notifications/read-all — mark all as read in PostgreSQL
router.post("/read-all", requireStaff, async (_req, res) => {
  try {
    await pool.query("UPDATE system_notifications SET is_read = true WHERE is_read = false");
    res.json({ ok: true });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ error: "Failed to mark notifications read." });
  }
});

export default router;
