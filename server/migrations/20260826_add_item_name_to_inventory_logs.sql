-- Migration: Add item_name column to inventory_logs table if not present
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS item_name VARCHAR(120);

-- Backfill item_name from inventory_items
UPDATE inventory_logs l
SET item_name = i.name
FROM inventory_items i
WHERE l.inventory_item_id = i.id AND (l.item_name IS NULL OR l.item_name = '');
