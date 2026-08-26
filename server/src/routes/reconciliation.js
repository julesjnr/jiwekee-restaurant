import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();

// GET /api/reconciliation — payment reconciliation transactions from PostgreSQL
router.get("/", requireStaff, async (req, res) => {
  try {
    const { method, status, search } = req.query;

    const conditions = [];
    const params = [];

    if (method) {
      params.push(method.trim().toLowerCase());
      conditions.push("LOWER(p.payment_method) = $" + params.length);
    }
    if (status) {
      params.push(status.trim().toLowerCase());
      conditions.push("LOWER(p.payment_status) = $" + params.length);
    }
    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(CAST(p.order_id AS TEXT) LIKE $${idx} OR LOWER(COALESCE(u.name, '')) LIKE $${idx} OR LOWER(COALESCE(p.transaction_id, '')) LIKE $${idx} OR LOWER(COALESCE(p.phone_number, '')) LIKE $${idx})`
      );
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const query = `
      SELECT
        p.id AS payment_id,
        p.order_id,
        COALESCE(u.name, 'Customer') AS customer_name,
        p.amount::float AS amount,
        p.payment_method,
        p.payment_status AS status,
        COALESCE(p.transaction_id, o.mpesa_receipt, '—') AS mpesa_receipt,
        COALESCE(o.checkout_id, '—') AS checkout_id,
        COALESCE(p.phone_number, o.phone_number, '—') AS phone_number,
        p.payment_date AS created_at
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.payment_date DESC
    `;

    const result = await pool.query(query, params);
    const transactions = result.rows;

    const completed = transactions.filter((t) => t.status === "Completed" || t.status === "Paid");
    const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
    const mpesaRevenue = completed
      .filter((t) => t.payment_method === "mpesa")
      .reduce((sum, t) => sum + t.amount, 0);
    const walletRevenue = completed
      .filter((t) => t.payment_method === "wallet")
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = transactions.filter((t) => t.status === "Pending").length;

    res.json({
      transactions,
      stats: {
        totalRevenue,
        mpesaRevenue,
        walletRevenue,
        totalTransactions: transactions.length,
        pendingCount,
      },
    });
  } catch (err) {
    console.error("Payment reconciliation fetch error:", err);
    res.status(500).json({ error: "Failed to load payment reconciliation records from database." });
  }
});

export default router;
