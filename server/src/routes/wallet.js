import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit, pushNotification } from "./auth.js";

const router = Router();

// GET /api/wallet/balance — real-time wallet balance and transaction summary from PostgreSQL
router.get("/balance", requireAuth, async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.wallet_balance::float AS wallet_balance,
         u.loyalty_points::int AS loyalty_points,
         u.loyalty_tier,
         u.last_transaction,
         COALESCE(w.currency, 'KES') AS currency
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userRes.rows[0];

    // Compute live aggregates from database transaction ledger
    const statsRes = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::float AS total_credited,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)::float AS total_spent,
         COUNT(*)::int AS transaction_count,
         MAX(created_at) AS last_ledger_activity
       FROM wallet_transactions
       WHERE user_id = $1`,
      [req.user.id]
    );

    const stats = statsRes.rows[0];

    res.json({
      balance: user.wallet_balance,
      currency: user.currency || "KES",
      loyalty_points: user.loyalty_points,
      loyalty_tier: user.loyalty_tier,
      last_transaction: user.last_transaction || stats.last_ledger_activity,
      total_credited: stats.total_credited,
      total_spent: stats.total_spent,
      transaction_count: stats.transaction_count,
    });
  } catch (err) {
    console.error("Fetch wallet balance error:", err);
    res.status(500).json({ error: "Failed to load wallet balance from database." });
  }
});

// GET /api/wallet/transactions — transaction history ledger from PostgreSQL
router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         transaction_type,
         amount::float AS amount,
         description,
         reference_id,
         balance_after::float AS balance_after,
         status,
         created_at
       FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    res.json({ transactions: result.rows });
  } catch (err) {
    console.error("Fetch wallet transactions error:", err);
    res.status(500).json({ error: "Failed to load wallet transactions." });
  }
});

// POST /api/wallet/topup — top up digital wallet with atomic database transaction
router.post("/topup", requireAuth, async (req, res) => {
  const { amount, paymentMethod = "mpesa", phone } = req.body;
  const topUpAmount = Number(amount);

  if (isNaN(topUpAmount) || topUpAmount <= 0) {
    return res.status(400).json({ error: "Please enter a valid top-up amount greater than 0." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock user row
    const userRes = await client.query(
      "SELECT id, name, email, wallet_balance, phone FROM users WHERE id = $1 FOR UPDATE",
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found." });
    }

    const user = userRes.rows[0];
    const previousBalance = Number(user.wallet_balance || 0);
    const newBalance = previousBalance + topUpAmount;
    const now = new Date();
    const referenceId = `TOPUP-${Date.now()}`;

    // 1. Update user wallet balance and last_transaction timestamp
    await client.query(
      `UPDATE users
       SET wallet_balance = $1, last_transaction = $2, updated_at = $2
       WHERE id = $3`,
      [newBalance, now, user.id]
    );

    // 2. Ensure wallet table is synchronized
    await client.query(
      `INSERT INTO wallets (user_id, balance, currency, last_updated, created_at)
       VALUES ($1, $2, 'KES', $3, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET balance = $2, last_updated = $3`,
      [user.id, newBalance, now]
    );

    const walletRes = await client.query("SELECT id FROM wallets WHERE user_id = $1", [user.id]);
    const walletId = walletRes.rows[0]?.id || null;

    // 3. Record transaction in wallet_transactions ledger
    const txRes = await client.query(
      `INSERT INTO wallet_transactions
         (wallet_id, user_id, transaction_type, amount, description, reference_id, balance_after, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        walletId,
        user.id,
        "topup",
        topUpAmount,
        `Wallet Top-up via ${paymentMethod.toUpperCase()}`,
        referenceId,
        newBalance,
        now,
      ]
    );

    // 4. Record in payments table for accounting & reconciliation
    await client.query(
      `INSERT INTO payments
         (order_id, user_id, payment_method, amount, payment_status, transaction_id, phone_number, payment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        null,
        user.id,
        paymentMethod,
        topUpAmount,
        "Completed",
        referenceId,
        phone || user.phone || null,
        now,
      ]
    );

    await client.query("COMMIT");

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "WALLET_TOPUP",
      entity: "wallets",
      entityId: String(user.id),
      details: `User topped up KES ${topUpAmount.toFixed(2)} via ${paymentMethod}. New balance: KES ${newBalance.toFixed(2)}`,
    });

    await pushNotification({
      title: "Wallet Top-up Successful",
      message: `KES ${topUpAmount.toFixed(2)} was credited to your Jiwekee digital wallet. New balance: KES ${newBalance.toFixed(2)}.`,
      type: "payment",
      linkUrl: "/dashboard",
    });

    res.json({
      ok: true,
      balance: newBalance,
      credited: topUpAmount,
      message: `Successfully topped up KES ${topUpAmount.toFixed(2)}! New wallet balance: KES ${newBalance.toFixed(2)}.`,
      transaction: txRes.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Wallet topup error:", err);
    res.status(500).json({ error: "Failed to process wallet top-up." });
  } finally {
    client.release();
  }
});

export default router;
