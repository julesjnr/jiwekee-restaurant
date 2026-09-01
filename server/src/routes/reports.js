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
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END)::int AS "todayOrdersCount",
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0)::float AS "totalSales",
        COUNT(*)::int AS "totalOrdersCount",
        COALESCE(AVG(CASE WHEN status = 'Paid' THEN amount ELSE NULL END), 0)::float AS "averageOrderValue",
        COALESCE(SUM(CASE WHEN status = 'Paid' AND payment_method = 'mpesa' THEN amount ELSE 0 END), 0)::float AS "mpesaRevenue",
        COALESCE(SUM(CASE WHEN status = 'Paid' AND payment_method = 'wallet' THEN amount ELSE 0 END), 0)::float AS "walletRevenue",
        COALESCE(SUM(CASE WHEN status = 'Paid' AND payment_method = 'cash' THEN amount ELSE 0 END), 0)::float AS "cashRevenue"
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

    // 5. Popular menu items (completed/paid orders)
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
      LIMIT 6
    `);

    // 6. Recent orders with attached items
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
        o.created_at,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'name', COALESCE(oi.name, m.name),
                'quantity', oi.quantity,
                'unit_price', oi.unit_price::float
              ) ORDER BY oi.id ASC
            ),
            '[]'::json
          )
          FROM order_items oi
          LEFT JOIN menu_items m ON oi.menu_item_id = m.id
          WHERE oi.order_id = o.id
        ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    // 7. Today's Reservations
    const todayResQuery = await pool.query(`
      SELECT
        r.id,
        r.customer_name,
        r.phone,
        r.email,
        to_char(r.reservation_date, 'YYYY-MM-DD') AS reservation_date,
        r.reservation_time,
        r.guests_count AS guest_count,
        r.table_id,
        r.table_number,
        r.status,
        r.special_requests,
        r.created_at
      FROM reservations r
      WHERE r.reservation_date = CURRENT_DATE
      ORDER BY r.reservation_time ASC
    `);

    const allPendingResQuery = await pool.query(`
      SELECT
        r.id,
        r.customer_name,
        r.phone,
        to_char(r.reservation_date, 'YYYY-MM-DD') AS reservation_date,
        r.reservation_time,
        r.guests_count AS guest_count,
        r.table_number,
        r.status,
        r.created_at
      FROM reservations r
      WHERE LOWER(r.status) = 'pending'
      ORDER BY r.reservation_date ASC, r.reservation_time ASC
      LIMIT 5
    `);

    // 8. Payment Reconciliation Summary
    const paymentReconRes = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'mpesa' AND (LOWER(payment_status) = 'completed' OR LOWER(payment_status) = 'paid') THEN amount ELSE 0 END), 0)::float AS mpesa_revenue,
        COUNT(CASE WHEN LOWER(payment_method) = 'mpesa' AND (LOWER(payment_status) = 'completed' OR LOWER(payment_status) = 'paid') THEN 1 END)::int AS mpesa_count,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'wallet' AND (LOWER(payment_status) = 'completed' OR LOWER(payment_status) = 'paid') THEN amount ELSE 0 END), 0)::float AS wallet_revenue,
        COUNT(CASE WHEN LOWER(payment_method) = 'wallet' AND (LOWER(payment_status) = 'completed' OR LOWER(payment_status) = 'paid') THEN 1 END)::int AS wallet_count,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' AND (LOWER(payment_status) = 'completed' OR LOWER(payment_status) = 'paid') THEN amount ELSE 0 END), 0)::float AS cash_revenue,
        COUNT(CASE WHEN LOWER(payment_method) = 'cash' AND (LOWER(payment_status) = 'completed' OR LOWER(payment_status) = 'paid') THEN 1 END)::int AS cash_count,
        COALESCE(SUM(CASE WHEN LOWER(payment_status) = 'pending' THEN amount ELSE 0 END), 0)::float AS pending_amount,
        COUNT(CASE WHEN LOWER(payment_status) = 'pending' THEN 1 END)::int AS pending_count,
        COALESCE(SUM(CASE WHEN LOWER(payment_status) = 'failed' THEN amount ELSE 0 END), 0)::float AS failed_amount,
        COUNT(CASE WHEN LOWER(payment_status) = 'failed' THEN 1 END)::int AS failed_count
      FROM payments
    `);
    const payRecon = paymentReconRes.rows[0] || {};

    // 9. Active Tables Count
    const activeTablesRes = await pool.query(`
      SELECT
        COUNT(CASE WHEN LOWER(status) = 'occupied' THEN 1 END)::int AS occupied,
        COUNT(CASE WHEN LOWER(status) = 'reserved' THEN 1 END)::int AS reserved,
        COUNT(CASE WHEN LOWER(status) = 'available' THEN 1 END)::int AS available,
        COUNT(*)::int AS total
      FROM restaurant_tables
    `);
    const tablesCount = activeTablesRes.rows[0] || {};

    // 10. Needs Attention Collection (Pending orders, unconfirmed reservations, low stock, failed payments)
    const pendingOrdersRes = await pool.query(`
      SELECT
        o.id,
        u.name AS user_name,
        o.amount::float AS amount,
        o.status,
        o.fulfillment_status,
        o.payment_method,
        o.order_type,
        o.table_number,
        o.created_at,
        ROUND(EXTRACT(EPOCH FROM (now() - o.created_at)) / 60)::int AS wait_minutes
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status = 'Pending' OR o.fulfillment_status = 'Pending'
      ORDER BY o.created_at ASC
      LIMIT 6
    `);

    const failedPaymentsRes = await pool.query(`
      SELECT
        p.id,
        p.order_id,
        COALESCE(u.name, 'Customer') AS user_name,
        p.amount::float AS amount,
        p.payment_method,
        p.payment_status,
        p.payment_date AS created_at
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE LOWER(p.payment_status) = 'failed'
      ORDER BY p.payment_date DESC
      LIMIT 4
    `);

    const needsAttention = [];

    // Add pending orders to attention list
    for (const po of pendingOrdersRes.rows) {
      needsAttention.push({
        id: `order-${po.id}`,
        category: "order",
        title: `Pending Order #${po.id}`,
        subtitle: `${po.user_name} • ${po.table_number ? `Table ${po.table_number}` : po.order_type}`,
        amount: po.amount,
        waitMinutes: po.wait_minutes,
        paymentMethod: po.payment_method,
        status: po.status,
        targetTab: "orders",
        actionLabel: "View Order",
        urgency: po.wait_minutes > 15 ? "high" : "medium",
      });
    }

    // Add pending reservations to attention list
    for (const pr of allPendingResQuery.rows) {
      needsAttention.push({
        id: `res-${pr.id}`,
        category: "reservation",
        title: `Unconfirmed Reservation #${pr.id}`,
        subtitle: `${pr.customer_name} • ${pr.guest_count} guests for ${pr.reservation_date} at ${pr.reservation_time}`,
        phone: pr.phone,
        status: pr.status,
        targetTab: "reservations",
        actionLabel: "Review Booking",
        urgency: "medium",
      });
    }

    // Add low stock items to attention list
    for (const ls of lowStockRes.rows.slice(0, 4)) {
      needsAttention.push({
        id: `stock-${ls.id}`,
        category: "inventory",
        title: `Low Stock: ${ls.name}`,
        subtitle: `Current: ${ls.current_quantity} ${ls.unit} (Min limit: ${ls.min_stock_level} ${ls.unit})`,
        supplier: ls.supplier,
        targetTab: "inventory",
        actionLabel: "Manage Inventory",
        urgency: ls.current_quantity <= (ls.min_stock_level * 0.5) ? "high" : "medium",
      });
    }

    // Add failed payments
    for (const fp of failedPaymentsRes.rows) {
      needsAttention.push({
        id: `pay-${fp.id}`,
        category: "payment",
        title: `Failed Payment for Order #${fp.order_id}`,
        subtitle: `${fp.user_name} • KES ${fp.amount.toFixed(2)} (${fp.payment_method})`,
        amount: fp.amount,
        targetTab: "reconciliation",
        actionLabel: "Investigate Payment",
        urgency: "high",
      });
    }

    res.json({
      todaySales: salesMetrics.todaySales,
      todayOrdersCount: Number(salesMetrics.todayOrdersCount),
      totalSales: salesMetrics.totalSales,
      totalOrdersCount: Number(salesMetrics.totalOrdersCount),
      averageOrderValue: salesMetrics.averageOrderValue,
      mpesaRevenue: salesMetrics.mpesaRevenue,
      walletRevenue: salesMetrics.walletRevenue,
      cashRevenue: salesMetrics.cashRevenue,
      totalCustomers: Number(totalCustomers),
      statusCounts,
      lowStockAlerts: lowStockRes.rows,
      popularItems: popularRes.rows,
      recentOrders: recentOrdersRes.rows,
      todayReservations: todayResQuery.rows,
      todayReservationsCount: todayResQuery.rows.length,
      pendingReservationsCount: allPendingResQuery.rows.length,
      tablesCount,
      needsAttention,
      paymentReconciliation: {
        mpesa: {
          revenue: payRecon.mpesa_revenue || 0,
          count: payRecon.mpesa_count || 0,
        },
        wallet: {
          revenue: payRecon.wallet_revenue || 0,
          count: payRecon.wallet_count || 0,
        },
        cash: {
          revenue: payRecon.cash_revenue || 0,
          count: payRecon.cash_count || 0,
        },
        pending: {
          amount: payRecon.pending_amount || 0,
          count: payRecon.pending_count || 0,
        },
        failed: {
          amount: payRecon.failed_amount || 0,
          count: payRecon.failed_count || 0,
        },
        totalRevenue: (payRecon.mpesa_revenue || 0) + (payRecon.wallet_revenue || 0) + (payRecon.cash_revenue || 0),
      },
      kitchenSummary: {
        confirmedCount: statusCounts.confirmed || 0,
        preparingCount: statusCounts.preparing || 0,
        readyCount: statusCounts.ready || 0,
        totalActiveCount: (statusCounts.confirmed || 0) + (statusCounts.preparing || 0) + (statusCounts.ready || 0),
      },
    });
  } catch (err) {
    console.error("Dashboard reports error:", err);
    res.status(500).json({ error: "Failed to compile dashboard reports from database." });
  }
});

// GET /api/reports/analytics — multi-range sales & volume trends from PostgreSQL
router.get("/analytics", requireStaff, async (req, res) => {
  try {
    const range = (req.query.period || req.query.range || "7d").toLowerCase();
    let salesSeries = [];

    if (range === "today" || range === "1d") {
      // 24-hour breakdown for today
      const hourlyRes = await pool.query(`
        SELECT
          to_char(h.hour, 'HH24:00') AS label,
          to_char(h.hour, 'HH24:00') AS time,
          to_char(h.hour, 'YYYY-MM-DD') AS date,
          COALESCE(SUM(CASE WHEN o.status = 'Paid' THEN o.amount ELSE 0 END), 0)::float AS sales,
          COUNT(o.id)::int AS orders
        FROM generate_series(
          date_trunc('day', CURRENT_TIMESTAMP),
          date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '23 hours',
          INTERVAL '1 hour'
        ) h(hour)
        LEFT JOIN orders o ON date_trunc('hour', o.created_at) = h.hour
        GROUP BY h.hour
        ORDER BY h.hour ASC
      `);
      salesSeries = hourlyRes.rows;
    } else if (range === "30d" || range === "30days" || range === "month") {
      // 30-day daily breakdown
      const monthRes = await pool.query(`
        SELECT
          to_char(d.day, 'DD Mon') AS label,
          to_char(d.day, 'Dy') AS "dayName",
          to_char(d.day, 'YYYY-MM-DD') AS date,
          COALESCE(SUM(CASE WHEN o.status = 'Paid' THEN o.amount ELSE 0 END), 0)::float AS sales,
          COUNT(o.id)::int AS orders
        FROM generate_series(
          CURRENT_DATE - INTERVAL '29 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        ) d(day)
        LEFT JOIN orders o ON o.created_at::date = d.day::date
        GROUP BY d.day
        ORDER BY d.day ASC
      `);
      salesSeries = monthRes.rows;
    } else {
      // Default: 7-day daily breakdown
      const dailyRes = await pool.query(`
        SELECT
          to_char(d.day, 'Dy') AS label,
          to_char(d.day, 'Dy') AS "dayName",
          to_char(d.day, 'YYYY-MM-DD') AS date,
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
      salesSeries = dailyRes.rows;
    }

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

    const cashRes = await pool.query(`
      SELECT
        COALESCE(SUM(amount), 0)::float AS revenue,
        COUNT(*)::int AS count
      FROM orders
      WHERE payment_method = 'cash' AND status = 'Paid'
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
      {
        method: "Cash Settlement",
        revenue: cashRes.rows[0].revenue,
        count: cashRes.rows[0].count,
      },
    ];

    res.json({
      period: range,
      salesSeries,
      dailySales: salesSeries, // Backward compatibility
      paymentBreakdown,
    });
  } catch (err) {
    console.error("Analytics reports error:", err);
    res.status(500).json({ error: "Failed to generate analytics from database." });
  }
});

export default router;
