import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();

// GET /api/reports/dashboard — unified summary metrics computed directly from PostgreSQL
router.get("/dashboard", requireStaff, async (_req, res) => {
  try {
    // 1. Sales and Order metrics
    const salesRes = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'Paid' AND created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0)::float AS "todaySales",
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) AS "todayOrdersCount",
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0)::float AS "totalSales",
        COUNT(*) AS "totalOrdersCount",
        COALESCE(AVG(CASE WHEN status = 'Paid' THEN amount ELSE NULL END), 0)::float AS "averageOrderValue",
        COALESCE(SUM(CASE WHEN status = 'Paid' AND payment_method = 'mpesa' THEN amount ELSE 0 END), 0)::float AS "mpesaRevenue",
        COALESCE(SUM(CASE WHEN status = 'Paid' AND payment_method = 'wallet' THEN amount ELSE 0 END), 0)::float AS "walletRevenue"
      FROM orders
    `);
    const salesMetrics = salesRes.rows[0];

    // 2. Customer metrics
    const custRes = await pool.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer' OR loyalty = true"
    );
    const totalCustomers = custRes.rows[0].count;

    // 3. Status pipeline counts
    const statusCountsRes = await pool.query(`
      SELECT
        COUNT(CASE WHEN fulfillment_status = 'Pending' OR status = 'Pending' THEN 1 END)::int AS pending,
        COUNT(CASE WHEN fulfillment_status = 'Confirmed' THEN 1 END)::int AS confirmed,
        COUNT(CASE WHEN fulfillment_status = 'Preparing' THEN 1 END)::int AS preparing,
        COUNT(CASE WHEN fulfillment_status = 'Ready' THEN 1 END)::int AS ready,
        COUNT(CASE WHEN fulfillment_status = 'Out for Delivery' THEN 1 END)::int AS "outForDelivery",
        COUNT(CASE WHEN fulfillment_status = 'Completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN fulfillment_status = 'Cancelled' THEN 1 END)::int AS cancelled
      FROM orders
    `);
    const statusCounts = statusCountsRes.rows[0];

    // 4. Low stock alerts
    const lowStockRes = await pool.query(`
      SELECT id, name, unit, current_quantity::float, min_stock_level::float, unit_cost::float, supplier
      FROM inventory_items
      WHERE current_quantity <= min_stock_level
      ORDER BY current_quantity ASC
    `);

    // 5. Popular menu items
    const popularRes = await pool.query(`
      SELECT
        oi.name,
        SUM(oi.quantity)::int AS quantity,
        SUM(oi.quantity * oi.unit_price)::float AS revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'Paid'
      GROUP BY oi.name
      ORDER BY quantity DESC
      LIMIT 5
    `);

    // 6. Recent orders
    const recentOrdersRes = await pool.query(`
      SELECT
        o.id,
        o.user_id,
        u.name AS user_name,
        o.amount::float AS amount,
        o.status,
        o.fulfillment_status,
        o.payment_method,
        o.order_type,
        o.table_number,
        o.mpesa_receipt,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 6
    `);

    res.json({
      todaySales: salesMetrics.todaySales,
      todayOrdersCount: Number(salesMetrics.todayOrdersCount),
      totalSales: salesMetrics.totalSales,
      totalOrdersCount: Number(salesMetrics.totalOrdersCount),
      averageOrderValue: salesMetrics.averageOrderValue,
      mpesaRevenue: salesMetrics.mpesaRevenue,
      walletRevenue: salesMetrics.walletRevenue,
      totalCustomers: Number(totalCustomers),
      statusCounts,
      lowStockAlerts: lowStockRes.rows,
      popularItems: popularRes.rows,
      recentOrders: recentOrdersRes.rows,
    });
  } catch (err) {
    console.error("Dashboard reports error:", err);
    res.status(500).json({ error: "Failed to compile dashboard reports from database." });
  }
});

// GET /api/reports/analytics — 7-day daily sales & payment breakdowns from PostgreSQL
router.get("/analytics", requireStaff, async (_req, res) => {
  try {
    const dailyRes = await pool.query(`
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS date,
        to_char(d.day, 'Dy') AS "dayName",
        COALESCE(SUM(CASE WHEN o.status = 'Paid' THEN o.amount ELSE 0 END), 0)::float AS sales,
        COUNT(o.id)::int AS orders
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) d(day)
      LEFT JOIN orders o ON o.created_at::date = d.day::date
      GROUP BY d.day
      ORDER BY d.day ASC
    `);

    const mpesaRes = await pool.query(`
      SELECT
        COALESCE(SUM(amount), 0)::float AS revenue,
        COUNT(*)::int AS count
      FROM orders
      WHERE payment_method = 'mpesa' AND status = 'Paid'
    `);

    const walletRes = await pool.query(`
      SELECT
        COALESCE(SUM(amount), 0)::float AS revenue,
        COUNT(*)::int AS count
      FROM orders
      WHERE payment_method = 'wallet' AND status = 'Paid'
    `);

    const paymentBreakdown = [
      {
        method: "M-Pesa STK",
        revenue: mpesaRes.rows[0].revenue,
        count: mpesaRes.rows[0].count,
      },
      {
        method: "Loyalty Wallet",
        revenue: walletRes.rows[0].revenue,
        count: walletRes.rows[0].count,
      },
    ];

    res.json({
      dailySales: dailyRes.rows,
      paymentBreakdown,
    });
  } catch (err) {
    console.error("Analytics reports error:", err);
    res.status(500).json({ error: "Failed to generate analytics from database." });
  }
});

export default router;
