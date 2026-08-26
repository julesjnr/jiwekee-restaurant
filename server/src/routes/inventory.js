import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";
import { logAudit, pushNotification } from "./auth.js";

const router = Router();

// GET /api/inventory — get all ingredients & stock alerts from PostgreSQL
router.get("/", requireStaff, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        unit,
        current_quantity::float AS current_quantity,
        min_stock_level::float AS min_stock_level,
        unit_cost::float AS unit_cost,
        supplier,
        last_restocked,
        created_at,
        (current_quantity <= min_stock_level) AS is_low_stock,
        (current_quantity * unit_cost)::float AS total_value
      FROM inventory_items
      ORDER BY name ASC
    `);

    const items = result.rows;
    const lowStockCount = items.filter((i) => i.is_low_stock).length;
    const totalInventoryValue = items.reduce((sum, i) => sum + i.total_value, 0);

    res.json({
      items,
      stats: {
        totalItems: items.length,
        lowStockCount,
        totalInventoryValue,
      },
    });
  } catch (err) {
    console.error("Inventory fetch error:", err);
    res.status(500).json({ error: "Failed to load inventory from database." });
  }
});

// POST /api/inventory — add new inventory ingredient to PostgreSQL
router.post("/", requireStaff, async (req, res) => {
  const { name, unit, current_quantity, min_stock_level, unit_cost, supplier } = req.body;
  if (!name || !unit) {
    return res.status(400).json({ error: "Name and unit are required." });
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO inventory_items (name, unit, current_quantity, min_stock_level, unit_cost, supplier, last_restocked)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       RETURNING id, name, unit, current_quantity::float AS current_quantity, min_stock_level::float AS min_stock_level, unit_cost::float AS unit_cost, supplier, last_restocked, created_at`,
      [
        name.trim(),
        unit.trim(),
        Number(current_quantity) || 0,
        Number(min_stock_level) || 5,
        Number(unit_cost) || 0,
        supplier ? supplier.trim() : "Local Supplier",
      ]
    );

    const newItem = insertRes.rows[0];

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "INVENTORY_CREATED",
      entity: "inventory_items",
      entityId: newItem.id,
      details: `Added new stock item: ${newItem.name} (${newItem.current_quantity} ${newItem.unit})`,
    });

    res.status(201).json({ item: newItem });
  } catch (err) {
    console.error("Add inventory error:", err);
    res.status(500).json({ error: "Failed to add inventory item." });
  }
});

// PUT /api/inventory/:id — update inventory item details in PostgreSQL
router.put("/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { name, unit, min_stock_level, unit_cost, supplier } = req.body;

  try {
    const updateRes = await pool.query(
      `UPDATE inventory_items
       SET
         name = COALESCE($1, name),
         unit = COALESCE($2, unit),
         min_stock_level = COALESCE($3, min_stock_level),
         unit_cost = COALESCE($4, unit_cost),
         supplier = COALESCE($5, supplier)
       WHERE id = $6
       RETURNING id, name, unit, current_quantity::float AS current_quantity, min_stock_level::float AS min_stock_level, unit_cost::float AS unit_cost, supplier, last_restocked, created_at`,
      [
        name !== undefined ? name.trim() : null,
        unit !== undefined ? unit.trim() : null,
        min_stock_level !== undefined ? Number(min_stock_level) : null,
        unit_cost !== undefined ? Number(unit_cost) : null,
        supplier !== undefined ? supplier.trim() : null,
        id,
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }

    const item = updateRes.rows[0];

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "INVENTORY_UPDATED",
      entity: "inventory_items",
      entityId: item.id,
      details: `Updated inventory details for ${item.name}`,
    });

    res.json({ item });
  } catch (err) {
    console.error("Update inventory error:", err);
    res.status(500).json({ error: "Failed to update inventory item." });
  }
});

// POST /api/inventory/:id/adjust — manual stock increment or decrement
router.post("/:id/adjust", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { delta, reason } = req.body;

  const change = Number(delta);
  if (isNaN(change) || change === 0) {
    return res.status(400).json({ error: "Specify a valid non-zero adjustment amount." });
  }

  try {
    const existing = await pool.query("SELECT * FROM inventory_items WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }

    const current = existing.rows[0];

    const updateRes = await pool.query(
      `UPDATE inventory_items
       SET
         current_quantity = GREATEST(0, current_quantity + $1),
         last_restocked = CASE WHEN $1 > 0 THEN now() ELSE last_restocked END
       WHERE id = $2
       RETURNING id, name, unit, current_quantity::float AS current_quantity, min_stock_level::float AS min_stock_level, unit_cost::float AS unit_cost, supplier, last_restocked`,
      [change, id]
    );

    const updatedItem = updateRes.rows[0];

    const logReason = reason || (change > 0 ? "Stock Delivery / Restock" : "Manual Adjustment / Shrinkage");
    const logRes = await pool.query(
      `INSERT INTO inventory_logs (inventory_item_id, item_name, change_quantity, reason, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, inventory_item_id, item_name, change_quantity::float AS change_quantity, reason, user_id, created_at`,
      [id, updatedItem.name, change, logReason, req.user.id]
    );

    const log = logRes.rows[0];

    if (updatedItem.current_quantity <= updatedItem.min_stock_level) {
      await pushNotification({
        title: `Low Stock Alert: ${updatedItem.name}`,
        message: `${updatedItem.name} is down to ${updatedItem.current_quantity} ${updatedItem.unit} (Min limit: ${updatedItem.min_stock_level} ${updatedItem.unit}).`,
        type: "inventory",
        linkUrl: "/admin?tab=inventory",
      });
    }

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: "INVENTORY_ADJUSTED",
      entity: "inventory_items",
      entityId: id,
      details: `Adjusted ${updatedItem.name} by ${change > 0 ? `+${change}` : change} ${updatedItem.unit} (${log.reason}). New qty: ${updatedItem.current_quantity} ${updatedItem.unit}`,
    });

    res.json({ item: updatedItem, log });
  } catch (err) {
    console.error("Adjust inventory error:", err);
    res.status(500).json({ error: "Failed to adjust stock." });
  }
});

// GET /api/inventory/logs — historical stock movement logs
router.get("/logs", requireStaff, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.inventory_item_id,
        COALESCE(l.item_name, i.name, 'Stock Item') AS item_name,
        l.change_quantity::float AS change_quantity,
        l.reason,
        l.user_id,
        u.name AS user_name,
        l.created_at
      FROM inventory_logs l
      LEFT JOIN inventory_items i ON l.inventory_item_id = i.id
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json({ logs: result.rows });
  } catch (err) {
    console.error("Fetch inventory logs error:", err);
    res.status(500).json({ error: "Failed to load inventory movement logs." });
  }
});

export default router;
