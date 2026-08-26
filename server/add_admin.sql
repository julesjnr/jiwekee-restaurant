ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(20) NOT NULL DEFAULT 'Received';

UPDATE users SET is_admin = TRUE WHERE email = 'ochieyjyulius@gmail.com';

\echo 'Admin migration complete.'
