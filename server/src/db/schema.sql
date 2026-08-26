-- Jiwekee Restaurant — Complete PostgreSQL Schema
-- Database-driven relational architecture for Jiwekee Restaurant Management System

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  loyalty         BOOLEAN NOT NULL DEFAULT FALSE,
  wallet_balance  NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0),
  loyalty_points  INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  loyalty_tier    VARCHAR(20) NOT NULL DEFAULT 'Bronze',
  role            VARCHAR(30) NOT NULL DEFAULT 'customer',
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  phone           VARCHAR(30),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(lower(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id            SERIAL PRIMARY KEY,
  table_number  VARCHAR(20) NOT NULL UNIQUE,
  capacity      INTEGER NOT NULL DEFAULT 4,
  status        VARCHAR(30) NOT NULL DEFAULT 'Available', -- Available | Occupied | Reserved | Maintenance
  section       VARCHAR(50) NOT NULL DEFAULT 'Main Dining',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id                SERIAL PRIMARY KEY,
  category_id       INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name              VARCHAR(120) NOT NULL UNIQUE,
  description       TEXT,
  price             NUMERIC(10, 2) NOT NULL,
  category          VARCHAR(60) NOT NULL DEFAULT 'Main Course',
  image_url         TEXT,
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  prep_time_minutes INTEGER NOT NULL DEFAULT 15,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount              NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status              VARCHAR(20) NOT NULL DEFAULT 'Pending',   -- Pending | Paid | Failed
  fulfillment_status  VARCHAR(30) NOT NULL DEFAULT 'Confirmed', -- Pending | Confirmed | Preparing | Ready | Out for Delivery | Completed | Cancelled
  payment_method      VARCHAR(20) NOT NULL DEFAULT 'mpesa',     -- mpesa | wallet | cash
  order_type          VARCHAR(20) NOT NULL DEFAULT 'Dine-In',   -- Dine-In | Takeaway | Delivery
  table_number        VARCHAR(20),
  delivery_address    TEXT,
  notes               TEXT,
  checkout_id         VARCHAR(100),                             -- M-Pesa CheckoutRequestID
  mpesa_receipt       VARCHAR(60),
  phone_number        VARCHAR(30),
  points_earned       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id                    SERIAL PRIMARY KEY,
  order_id              INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id          INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  name                  VARCHAR(120),
  quantity              INTEGER NOT NULL DEFAULT 1,
  unit_price            NUMERIC(10, 2) NOT NULL,
  total_price           NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  special_instructions  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 7. Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name     VARCHAR(120) NOT NULL,
  phone             VARCHAR(30) NOT NULL,
  email             VARCHAR(160),
  reservation_date  DATE NOT NULL,
  reservation_time  VARCHAR(10) NOT NULL,
  guests_count      INTEGER NOT NULL DEFAULT 2,
  table_id          INTEGER REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  table_number      VARCHAR(20),
  special_requests  TEXT,
  status            VARCHAR(30) NOT NULL DEFAULT 'Pending', -- Pending | Confirmed | Seated | Completed | Cancelled | No-Show
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 8. Payments
CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  payment_method  VARCHAR(50) NOT NULL, -- mpesa | wallet | cash
  amount          NUMERIC(10, 2) NOT NULL,
  payment_status  VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending | Completed | Failed | Refunded
  transaction_id  VARCHAR(255),
  phone_number    VARCHAR(30),
  payment_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- 9. Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(120) NOT NULL UNIQUE,
  unit              VARCHAR(20) NOT NULL DEFAULT 'kg', -- kg | g | L | ml | pcs | packs
  current_quantity  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  min_stock_level   NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  unit_cost         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  supplier          VARCHAR(120) DEFAULT 'Local Market Suppliers',
  last_restocked    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Menu Item Ingredients
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id                SERIAL PRIMARY KEY,
  menu_item_id      INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_required NUMERIC(10, 3) NOT NULL
);

-- 11. Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id                SERIAL PRIMARY KEY,
  inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  item_name         VARCHAR(120),
  change_quantity   NUMERIC(10, 2) NOT NULL,
  reason            VARCHAR(150) NOT NULL,
  user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Loyalty Logs
CREATE TABLE IF NOT EXISTS loyalty_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_delta  INTEGER NOT NULL,
  reason        VARCHAR(200) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name   VARCHAR(120),
  action      VARCHAR(80) NOT NULL,
  entity      VARCHAR(60) NOT NULL,
  entity_id   VARCHAR(60),
  details     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. System Notifications
CREATE TABLE IF NOT EXISTS system_notifications (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(30) NOT NULL DEFAULT 'info', -- order | payment | inventory | reservation | info
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  link_url    VARCHAR(200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- Convenient compatibility view for "tables"
CREATE OR REPLACE VIEW tables AS
  SELECT id, table_number, capacity, status, section, created_at, updated_at
  FROM restaurant_tables;
