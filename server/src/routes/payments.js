import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/payments — payment history directly from PostgreSQL payments table
router.get("/", requireAuth, async (req, res) => {
  try {
    const isStaff = req.user.is_admin || req.user.role !== "customer";

    const query = isStaff
      ? `SELECT
           p.id,
           p.order_id,
           p.user_id,
           COALESCE(u.name, 'Customer') AS customer_name,
           p.payment_method,
           p.amount::float AS amount,
           p.payment_status,
           p.transaction_id,
           p.phone_number,
           p.payment_date,
           p.created_at
         FROM payments p
         LEFT JOIN users u ON p.user_id = u.id
         ORDER BY p.payment_date DESC`
      : `SELECT
           p.id,
           p.order_id,
           p.user_id,
           p.payment_method,
           p.amount::float AS amount,
           p.payment_status,
           p.transaction_id,
           p.phone_number,
           p.payment_date,
           p.created_at
         FROM payments p
         WHERE p.user_id = $1
         ORDER BY p.payment_date DESC`;

    const params = isStaff ? [] : [req.user.id];
    const result = await pool.query(query, params);

    res.json({ payments: result.rows });
  } catch (err) {
    console.error("Fetch payments error:", err);
    res.status(500).json({ error: "Failed to load payment records from database." });
  }
});

export default router;
