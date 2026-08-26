import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";
import { logAudit, pushNotification } from "./auth.js";

const router = Router();

// GET /api/kds — active kitchen orders from PostgreSQL
router.get("/", requireStaff, async (_req, res) => {
  try {
    const ordersResult = await pool.query(`
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
        o.notes,
        o.phone_number,
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
      WHERE o.fulfillment_status IN ('Pending', 'Confirmed', 'Preparing', 'Ready')
         OR (o.status = 'Paid' AND o.fulfillment_status NOT IN ('Completed', 'Cancelled'))
      ORDER BY o.created_at ASC
    `);

    res.json({ orders: ordersResult.rows });
  } catch (err) {
    console.error("KDS fetch error:", err);
    res.status(500).json({ error: "Failed to load kitchen tickets from database." });
  }
});

// PATCH /api/kds/:id/advance — kitchen one-click state progression
router.patch("/:id/advance", requireStaff, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await pool.query(
      "SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Order ticket not found." });
    }

    const order = existing.rows[0];
    let nextStage = order.fulfillment_status;

    if (order.fulfillment_status === "Pending" || order.fulfillment_status === "Confirmed") {
      nextStage = "Preparing";
    } else if (order.fulfillment_status === "Preparing") {
      nextStage = "Ready";
    } else if (order.fulfillment_status === "Ready") {
      nextStage = "Out for Delivery";
    } else if (order.fulfillment_status === "Out for Delivery") {
      nextStage = "Completed";
    }

    const prev = order.fulfillment_status;

    const updateRes = await pool.query(
      "UPDATE orders SET fulfillment_status = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [nextStage, id]
    );

    const updated = updateRes.rows[0];

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "KDS_TICKET_ADVANCED",
      entity: "orders",
      entityId: id,
      details: `Kitchen advanced Order #${id} from '${prev}' to '${nextStage}'`,
    });

    if (nextStage === "Ready") {
      await pushNotification({
        title: `Order #${id} is READY!`,
        message: `Kitchen finished preparing Order #${id} for ${order.user_name} (${order.table_number ? `Table ${order.table_number}` : order.order_type}).`,
        type: "order",
        linkUrl: "/admin?tab=orders",
      });
    }

    res.json({ order: { ...updated, user_name: order.user_name } });
  } catch (err) {
    console.error("KDS advance error:", err);
    res.status(500).json({ error: "Failed to advance kitchen ticket." });
  }
});

export default router;
