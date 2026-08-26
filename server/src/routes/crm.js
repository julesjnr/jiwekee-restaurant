import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import { logAudit } from "./auth.js";

const router = Router();

function getCustomerSegment(orderCount, totalSpent, daysSinceLastOrder) {
  if (totalSpent >= 5000 || orderCount >= 5) return "VIP";
  if (orderCount === 0) return "New";
  if (daysSinceLastOrder > 30) return "Inactive";
  if (orderCount > 1) return "Returning";
  return "New";
}

// GET /api/crm — customer list with live database metrics and segments
router.get("/", requireStaff, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(u.phone, '—') AS phone,
        u.wallet_balance::float AS wallet_balance,
        u.loyalty_points::int AS loyalty_points,
        u.loyalty_tier,
        u.created_at,
        COUNT(o.id)::int AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'Paid' THEN o.amount ELSE 0 END), 0)::float AS total_spent,
        MAX(o.created_at) AS last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer' OR u.loyalty = true
      GROUP BY u.id
      ORDER BY u.id ASC
    `);

    const customers = result.rows.map((user) => {
      let daysSinceLast = 999;
      if (user.last_order_date) {
        daysSinceLast = Math.floor(
          (Date.now() - new Date(user.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      const segment = getCustomerSegment(user.total_orders, user.total_spent, daysSinceLast);

      let tier = "Bronze";
      if (user.loyalty_points >= 500) tier = "Platinum";
      else if (user.loyalty_points >= 250) tier = "Gold";
      else if (user.loyalty_points >= 100) tier = "Silver";

      return {
        ...user,
        loyalty_tier: tier,
        segment,
      };
    });

    const totalCustomers = customers.length;
    const vipCount = customers.filter((c) => c.segment === "VIP").length;
    const returningCount = customers.filter((c) => c.segment === "Returning").length;
    const totalCustomerSpend = customers.reduce((sum, c) => sum + c.total_spent, 0);

    res.json({
      customers,
      stats: {
        totalCustomers,
        vipCount,
        returningCount,
        totalCustomerSpend,
      },
    });
  } catch (err) {
    console.error("CRM fetch error:", err);
    res.status(500).json({ error: "Failed to load customer CRM data from database." });
  }
});

// POST /api/crm/:id/adjust-points — staff adjusts customer loyalty points in PostgreSQL
router.post("/:id/adjust-points", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { points_delta, reason } = req.body;

  const delta = Number(points_delta);
  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ error: "Invalid points amount." });
  }

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const user = userRes.rows[0];

    const updateRes = await pool.query(
      `UPDATE users
       SET
         loyalty_points = GREATEST(0, loyalty_points + $1),
         updated_at = now()
       WHERE id = $2
       RETURNING id, name, email, loyalty_points, wallet_balance::float as wallet_balance`,
      [delta, id]
    );

    const updatedUser = updateRes.rows[0];

    await pool.query(
      "INSERT INTO loyalty_logs (user_id, points_delta, reason) VALUES ($1, $2, $3)",
      [id, delta, reason || "Manual Staff Adjustment"]
    );

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "LOYALTY_POINTS_ADJUSTED",
      entity: "users",
      entityId: id,
      details: `Adjusted points for ${user.name} by ${delta > 0 ? `+${delta}` : delta} pts (${reason})`,
    });

    res.json({ user: updatedUser });
  } catch (err) {
    console.error("Adjust points error:", err);
    res.status(500).json({ error: "Failed to adjust points." });
  }
});

// POST /api/crm/redeem-points — customer converts points to wallet cash in PostgreSQL
router.post("/redeem-points", requireAuth, async (req, res) => {
  const { points } = req.body;
  const pointsToRedeem = Number(points);

  if (isNaN(pointsToRedeem) || pointsToRedeem < 50) {
    return res.status(400).json({ error: "Minimum 50 points required to redeem rewards." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRes = await client.query(
      "SELECT * FROM users WHERE id = $1 FOR UPDATE",
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found." });
    }

    const user = userRes.rows[0];
    if ((user.loyalty_points || 0) < pointsToRedeem) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `You have ${user.loyalty_points || 0} points, which is less than requested ${pointsToRedeem} points.`,
      });
    }

    const rewardCash = pointsToRedeem * 1.0;
    const newPoints = user.loyalty_points - pointsToRedeem;
    const newWallet = Number(user.wallet_balance) + rewardCash;
    const now = new Date();

    await client.query(
      `UPDATE users
       SET loyalty_points = $1, wallet_balance = $2, last_transaction = $3, updated_at = $3
       WHERE id = $4`,
      [newPoints, newWallet, now, user.id]
    );

    await client.query(
      `INSERT INTO wallets (user_id, balance, currency, last_updated, created_at)
       VALUES ($1, $2, 'KES', $3, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET balance = $2, last_updated = $3`,
      [user.id, newWallet, now]
    );

    const walletRes = await client.query("SELECT id FROM wallets WHERE user_id = $1", [user.id]);
    const walletId = walletRes.rows[0]?.id || null;

    await client.query(
      `INSERT INTO wallet_transactions
         (wallet_id, user_id, transaction_type, amount, description, reference_id, balance_after, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        walletId,
        user.id,
        "points_redemption",
        rewardCash,
        `Redeemed ${pointsToRedeem} points for KES ${rewardCash.toFixed(2)} Wallet Credit`,
        `REWARD-${user.id}-${Date.now()}`,
        newWallet,
        now,
      ]
    );

    await client.query(
      `INSERT INTO loyalty_logs (user_id, points_delta, reason)
       VALUES ($1, $2, $3)`,
      [user.id, -pointsToRedeem, `Redeemed ${pointsToRedeem} points for KES ${rewardCash.toFixed(2)} Wallet Credit`]
    );

    await client.query("COMMIT");

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "LOYALTY_POINTS_REDEEMED",
      entity: "users",
      entityId: user.id,
      details: `Redeemed ${pointsToRedeem} points for KES ${rewardCash.toFixed(2)} wallet credit`,
    });

    res.json({
      wallet_balance: newWallet,
      loyalty_points: newPoints,
      reward_cash: rewardCash,
      message: `Congratulations! ${pointsToRedeem} points redeemed for KES ${rewardCash.toFixed(2)} wallet balance.`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Redeem points error:", err);
    res.status(500).json({ error: "Failed to redeem points." });
  } finally {
    client.release();
  }
});

// GET /api/crm/loyalty-logs — user's point history
router.get("/loyalty-logs", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM loyalty_logs WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    console.error("Fetch loyalty logs error:", err);
    res.status(500).json({ error: "Failed to load loyalty logs." });
  }
});

export default router;
