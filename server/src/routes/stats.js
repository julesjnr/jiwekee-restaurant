import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

// GET /api/stats — real-time statistics computed directly from PostgreSQL
router.get("/", async (_req, res) => {
  try {
    const ordersRes = await pool.query(`
      SELECT
        COUNT(*)::int AS total_orders,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0)::float AS total_revenue,
        COALESCE(SUM(CASE WHEN status = 'Paid' AND created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0)::float AS today_sales
      FROM orders
    `);

    const tablesRes = await pool.query(`
      SELECT
        COUNT(*)::int AS total_tables,
        COUNT(CASE WHEN LOWER(status) = 'occupied' THEN 1 END)::int AS active_tables
      FROM restaurant_tables
    `);

    const usersRes = await pool.query(`
      SELECT COUNT(*)::int AS total_customers
      FROM users
      WHERE role = 'customer' OR loyalty = true
    `);

    const menuRes = await pool.query(`
      SELECT COUNT(*)::int AS menu_dishes
      FROM menu_items
      WHERE is_available = true
    `);

    const stats = {
      total_orders: ordersRes.rows[0]?.total_orders || 0,
      total_revenue: ordersRes.rows[0]?.total_revenue || 0,
      today_sales: ordersRes.rows[0]?.today_sales || 0,
      total_tables: tablesRes.rows[0]?.total_tables || 0,
      active_tables: tablesRes.rows[0]?.active_tables || 0,
      total_customers: usersRes.rows[0]?.total_customers || 0,
      menu_dishes: menuRes.rows[0]?.menu_dishes || 0,
    };

    res.json(stats);
  } catch (err) {
    console.error("Fetch stats error:", err);
    res.status(500).json({ error: "Failed to compute statistics from database." });
  }
});

export default router;
