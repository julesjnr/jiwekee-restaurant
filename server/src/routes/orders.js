import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import { initiateStkPush } from "./mpesa.js";
import { logAudit, pushNotification } from "./auth.js";
import { sendOrderConfirmationEmail, sendPaymentReceiptEmail } from "../services/emailService.js";

const router = Router();

export const FULFILLMENT_STAGES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Completed",
  "Cancelled",
];

// Helper to attach order_items to an array of orders
async function attachOrderItems(orders) {
  if (!orders || orders.length === 0) return [];
  const orderIds = orders.map((o) => o.id);

  const itemsResult = await pool.query(
    `SELECT
       oi.id,
       oi.order_id,
       oi.menu_item_id,
       COALESCE(oi.name, m.name) AS name,
       oi.quantity,
       oi.unit_price::float as unit_price,
       (oi.quantity * oi.unit_price)::float as total_price,
       oi.special_instructions
     FROM order_items oi
     LEFT JOIN menu_items m ON oi.menu_item_id = m.id
     WHERE oi.order_id = ANY($1::int[])
     ORDER BY oi.id ASC`,
    [orderIds]
  );

  const itemsMap = new Map();
  for (const item of itemsResult.rows) {
    if (!itemsMap.has(item.order_id)) {
      itemsMap.set(item.order_id, []);
    }
    itemsMap.get(item.order_id).push(item);
  }

  return orders.map((o) => ({
    ...o,
    amount: Number(o.amount),
    items: itemsMap.get(o.id) || [],
  }));
}

// GET /api/orders — user's own order history from database
router.get("/", requireAuth, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT
         o.id,
         o.user_id,
         u.name AS user_name,
         o.amount::float AS amount,
         o.status,
         o.fulfillment_status,
         o.payment_method,
         o.order_type,
         o.table_number,
         o.delivery_address,
         o.notes,
         o.checkout_id,
         o.mpesa_receipt,
         o.phone_number,
         o.points_earned,
         o.created_at,
         o.updated_at
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    const ordersWithItems = await attachOrderItems(ordersResult.rows);
    res.json({ orders: ordersWithItems });
  } catch (err) {
    console.error("Fetch user orders error:", err);
    res.status(500).json({ error: "Could not load orders from database." });
  }
});

// GET /api/orders/all — staff/admin orders list with database filters
router.get("/all", requireStaff, async (req, res) => {
  try {
    const { status, fulfillment, search } = req.query;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status.trim().toLowerCase());
      conditions.push("LOWER(o.status) = $" + params.length);
    }
    if (fulfillment) {
      params.push(fulfillment.trim().toLowerCase());
      conditions.push("LOWER(o.fulfillment_status) = $" + params.length);
    }
    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(CAST(o.id AS TEXT) LIKE $${idx} OR LOWER(u.name) LIKE $${idx} OR LOWER(COALESCE(o.phone_number, '')) LIKE $${idx} OR LOWER(COALESCE(o.table_number, '')) LIKE $${idx} OR LOWER(COALESCE(o.mpesa_receipt, '')) LIKE $${idx})`
      );
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const ordersQuery = `
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
        o.delivery_address,
        o.notes,
        o.checkout_id,
        o.mpesa_receipt,
        o.phone_number,
        o.points_earned,
        o.created_at,
        o.updated_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const ordersResult = await pool.query(ordersQuery, params);
    const ordersWithItems = await attachOrderItems(ordersResult.rows);

    res.json({ orders: ordersWithItems });
  } catch (err) {
    console.error("Fetch all orders error:", err);
    res.status(500).json({ error: "Could not fetch orders from database." });
  }
});

// GET /api/orders/:id — single order details
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const orderResult = await pool.query(
      `SELECT
         o.id,
         o.user_id,
         u.name AS user_name,
         o.amount::float AS amount,
         o.status,
         o.fulfillment_status,
         o.payment_method,
         o.order_type,
         o.table_number,
         o.delivery_address,
         o.notes,
         o.checkout_id,
         o.mpesa_receipt,
         o.phone_number,
         o.points_earned,
         o.created_at,
         o.updated_at
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = orderResult.rows[0];

    const isOwner = req.user.id === order.user_id;
    const isStaff = req.user.is_admin || req.user.role !== "customer";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: "Unauthorized access to order." });
    }

    const [orderWithItems] = await attachOrderItems([order]);
    res.json({ order: orderWithItems });
  } catch (err) {
    console.error("Fetch single order error:", err);
    res.status(500).json({ error: "Could not load order details." });
  }
});

// POST /api/orders — database-backed transactional checkout
router.post("/", requireAuth, async (req, res) => {
  const { items, paymentMethod, phone, orderType, tableNumber, deliveryAddress, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }
  if (!["wallet", "mpesa", "cash"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Choose a valid payment method (wallet, mpesa, or cash)." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Lock and load user
    const userRes = await client.query(
      "SELECT * FROM users WHERE id = $1 FOR UPDATE",
      [req.user.id]
    );
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "User session invalid." });
    }
    const user = userRes.rows[0];

    // 2. Fetch dishes from menu_items table in database
    const itemIds = items.map((i) => Number(i.id));
    const menuRes = await client.query(
      "SELECT id, name, price::float as price, is_available FROM menu_items WHERE id = ANY($1::int[])",
      [itemIds]
    );

    const menuMap = new Map(menuRes.rows.map((m) => [m.id, m]));
    let calculatedTotal = 0;
    const orderItemsToInsert = [];

    for (const item of items) {
      const menuItem = menuMap.get(Number(item.id));
      const qty = Number(item.quantity) || 0;
      if (!menuItem || qty <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Invalid item in cart (${item.name || item.id}).` });
      }
      if (menuItem.is_available === false) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Dish "${menuItem.name}" is currently sold out.` });
      }
      const itemSubtotal = menuItem.price * qty;
      calculatedTotal += itemSubtotal;
      orderItemsToInsert.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: qty,
        unit_price: menuItem.price,
      });
    }

    const pointsEarned = Math.floor(calculatedTotal / 100);

    // 3. Handle Wallet Payment
    if (paymentMethod === "wallet") {
      if (Number(user.wallet_balance) < calculatedTotal) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Insufficient wallet balance. You have KES ${Number(user.wallet_balance).toFixed(2)}, but order is KES ${calculatedTotal.toFixed(2)}.`,
        });
      }

      // Deduct wallet balance and reward loyalty points in PostgreSQL
      const newBalance = Number(user.wallet_balance) - calculatedTotal;
      const newPoints = user.loyalty ? Number(user.loyalty_points) + pointsEarned : Number(user.loyalty_points);
      const now = new Date();

      await client.query(
        "UPDATE users SET wallet_balance = $1, loyalty_points = $2, last_transaction = $3, updated_at = $3 WHERE id = $4",
        [newBalance, newPoints, now, user.id]
      );

      await client.query(
        `INSERT INTO wallets (user_id, balance, currency, last_updated, created_at)
         VALUES ($1, $2, 'KES', $3, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET balance = $2, last_updated = $3`,
        [user.id, newBalance, now]
      );

      const walletRes = await client.query("SELECT id FROM wallets WHERE user_id = $1", [user.id]);
      const walletId = walletRes.rows[0]?.id || null;

      if (user.loyalty && pointsEarned > 0) {
        await client.query(
          "INSERT INTO loyalty_logs (user_id, points_delta, reason) VALUES ($1, $2, $3)",
          [user.id, pointsEarned, `Points earned from Order payment`]
        );
      }
    }

    // 4. Create Order in database
    const initialStatus = paymentMethod === "wallet" ? "Paid" : "Pending";
    const initialFulfillment = "Confirmed";

    const orderInsert = await client.query(
      `INSERT INTO orders (user_id, amount, status, fulfillment_status, payment_method, order_type, table_number, delivery_address, notes, phone_number, points_earned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        user.id,
        calculatedTotal,
        initialStatus,
        initialFulfillment,
        paymentMethod,
        orderType || "Dine-In",
        tableNumber || null,
        deliveryAddress || null,
        notes || null,
        phone || user.phone || null,
        pointsEarned,
      ]
    );

    const newOrder = orderInsert.rows[0];

    // 5. Insert order_items
    for (const oi of orderItemsToInsert) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [newOrder.id, oi.menu_item_id, oi.name, oi.quantity, oi.unit_price]
      );
    }

    // 6. Record payment in payments table
    const paymentStatus = initialStatus === "Paid" ? "Completed" : "Pending";
    const paymentTxnId = paymentMethod === "wallet" ? `WALLET-TXN-${newOrder.id}` : null;

    await client.query(
      `INSERT INTO payments (order_id, user_id, payment_method, amount, payment_status, transaction_id, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [newOrder.id, user.id, paymentMethod, calculatedTotal, paymentStatus, paymentTxnId, phone || user.phone || null]
    );

    if (paymentMethod === "wallet") {
      const walletRes = await client.query("SELECT id FROM wallets WHERE user_id = $1", [user.id]);
      const walletId = walletRes.rows[0]?.id || null;
      const finalBalance = Number(user.wallet_balance) - calculatedTotal;

      await client.query(
        `INSERT INTO wallet_transactions
           (wallet_id, user_id, transaction_type, amount, description, reference_id, balance_after, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
        [
          walletId,
          user.id,
          "order_payment",
          -calculatedTotal,
          `Payment for Platter Order #${newOrder.id}`,
          `ORD-${newOrder.id}`,
          finalBalance,
        ]
      );
    }

    await client.query("COMMIT");

    // 7. Post-commit actions: M-Pesa STK push, notifications, audit logging
    if (paymentMethod === "mpesa") {
      const stkResult = await initiateStkPush({
        amount: calculatedTotal,
        phone: phone || user.phone,
        orderId: newOrder.id,
      });

      if (stkResult.checkoutRequestId) {
        await pool.query(
          "UPDATE orders SET checkout_id = $1 WHERE id = $2",
          [stkResult.checkoutRequestId, newOrder.id]
        );
        newOrder.checkout_id = stkResult.checkoutRequestId;
      }

      await logAudit({
        userId: user.id,
        userName: user.name,
        action: "ORDER_CREATED_MPESA",
        entity: "orders",
        entityId: newOrder.id,
        details: `Order #${newOrder.id} created for KES ${calculatedTotal}. STK push sent to ${phone || user.phone}`,
      });

      await pushNotification({
        title: `New Incoming Order #${newOrder.id}`,
        message: `${user.name} placed ${newOrder.order_type} order (KES ${calculatedTotal.toFixed(2)}) via M-Pesa.`,
        type: "order",
        linkUrl: "/admin?tab=orders",
      });

      const [orderPayload] = await attachOrderItems([newOrder]);

      // Send Order Confirmation Email
      if (user.email) {
        sendOrderConfirmationEmail({
          email: user.email,
          name: user.name,
          order: orderPayload,
        }).catch((err) => console.error("[Order Email Error]", err.message));
      }

      return res.status(202).json({
        status: "Pending",
        orderId: newOrder.id,
        total: calculatedTotal,
        order: orderPayload,
        message: stkResult.message,
      });
    }

    // Wallet flow response
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "ORDER_CREATED_WALLET",
      entity: "orders",
      entityId: newOrder.id,
      details: `Order #${newOrder.id} paid via Loyalty Wallet. Total: KES ${calculatedTotal}`,
    });

    await pushNotification({
      title: `New Paid Order #${newOrder.id}`,
      message: `${user.name} placed ${newOrder.order_type} order (KES ${calculatedTotal.toFixed(2)}) via Wallet.`,
      type: "order",
      linkUrl: "/admin?tab=orders",
    });

    const [orderPayload] = await attachOrderItems([newOrder]);

    // Send Order Confirmation & Payment Receipt Email
    if (user.email) {
      sendOrderConfirmationEmail({
        email: user.email,
        name: user.name,
        order: orderPayload,
      }).catch((err) => console.error("[Order Email Error]", err.message));

      sendPaymentReceiptEmail({
        email: user.email,
        name: user.name,
        order: orderPayload,
        payment: {
          transaction_id: `WALLET-TXN-${newOrder.id}`,
          amount: calculatedTotal,
          payment_method: "wallet",
        },
      }).catch((err) => console.error("[Receipt Email Error]", err.message));
    }

    return res.status(201).json({
      status: "Paid",
      orderId: newOrder.id,
      total: calculatedTotal,
      order: orderPayload,
      message: "Payment successful! Your order has been placed with the kitchen.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Checkout error:", err);
    res.status(500).json({ error: err.message || "Checkout failed. Please try again." });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/fulfillment — staff advances order lifecycle
router.patch("/:id/fulfillment", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { fulfillment_status, status } = req.body;

  if (fulfillment_status && !FULFILLMENT_STAGES.includes(fulfillment_status)) {
    return res.status(400).json({
      error: `Invalid status. Choose from: ${FULFILLMENT_STAGES.join(", ")}`,
    });
  }

  try {
    const existingRes = await pool.query(
      "SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1",
      [id]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = existingRes.rows[0];
    const previousStage = order.fulfillment_status;

    const updateRes = await pool.query(
      `UPDATE orders
       SET
         fulfillment_status = COALESCE($1, fulfillment_status),
         status = COALESCE($2, status),
         updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [fulfillment_status || null, status || null, id]
    );

    const updatedOrder = updateRes.rows[0];

    // If fulfillment moved to 'Completed', deduct inventory from database
    if (fulfillment_status === "Completed" && previousStage !== "Completed") {
      const itemsRes = await pool.query(
        "SELECT * FROM order_items WHERE order_id = $1",
        [id]
      );

      for (const item of itemsRes.rows) {
        const invRes = await pool.query(
          "SELECT id, name, current_quantity FROM inventory_items WHERE current_quantity > 0 ORDER BY id ASC LIMIT 1"
        );
        if (invRes.rows.length > 0) {
          const invItem = invRes.rows[0];
          const deduction = 0.5 * Number(item.quantity || 1);
          await pool.query(
            "UPDATE inventory_items SET current_quantity = GREATEST(0, current_quantity - $1) WHERE id = $2",
            [deduction, invItem.id]
          );
          await pool.query(
            "INSERT INTO inventory_logs (inventory_item_id, item_name, change_quantity, reason, user_id) VALUES ($1, $2, $3, $4, $5)",
            [invItem.id, invItem.name, -deduction, `Order #${id} Fulfillment`, req.user.id]
          );
        }
      }
    }

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "ORDER_STATUS_CHANGED",
      entity: "orders",
      entityId: id,
      details: `Order #${id} moved from '${previousStage}' to '${updatedOrder.fulfillment_status}' (Payment: ${updatedOrder.status})`,
    });

    await pushNotification({
      title: `Order #${id} Status: ${updatedOrder.fulfillment_status}`,
      message: `Order #${id} for ${order.user_name} is now ${updatedOrder.fulfillment_status}.`,
      type: "order",
      linkUrl: "/admin?tab=orders",
    });

    const [orderWithItems] = await attachOrderItems([{ ...updatedOrder, user_name: order.user_name }]);
    res.json({ order: orderWithItems });
  } catch (err) {
    console.error("Order fulfillment error:", err);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

export default router;
