-- Jiwekee Restaurant - Initialize schema and seed data
-- Require: PostgreSQL with the `pgcrypto` extension for bcrypt-style hashing.
-- Run as: psql -d jiwekee_restaurant -f db_init_and_seed.sql

-- 1. Enable pgcrypto for crypt()/gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  loyalty         BOOLEAN NOT NULL DEFAULT FALSE,
  wallet_balance  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  loyalty_points  INTEGER NOT NULL DEFAULT 0,
  loyalty_tier    VARCHAR(20) NOT NULL DEFAULT 'Bronze',
  role            VARCHAR(30) NOT NULL DEFAULT 'customer',
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  phone           VARCHAR(30),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(120) NOT NULL,
  description       TEXT,
  price             NUMERIC(10, 2) NOT NULL,
  category          VARCHAR(60) NOT NULL DEFAULT 'Main Course',
  image_url         TEXT,
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  prep_time_minutes INTEGER NOT NULL DEFAULT 15,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Other tables (minimal set used by server)
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount              NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status              VARCHAR(20) NOT NULL DEFAULT 'Pending',
  fulfillment_status  VARCHAR(30) NOT NULL DEFAULT 'Confirmed',
  payment_method      VARCHAR(20) NOT NULL DEFAULT 'mpesa',
  order_type          VARCHAR(20) NOT NULL DEFAULT 'Dine-In',
  table_number        VARCHAR(20),
  delivery_address    TEXT,
  notes               TEXT,
  checkout_id         VARCHAR(60),
  mpesa_receipt       VARCHAR(60),
  phone_number        VARCHAR(20),
  points_earned       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    INTEGER NOT NULL REFERENCES menu_items(id),
  quantity        INTEGER NOT NULL,
  unit_price      NUMERIC(10, 2) NOT NULL
);

-- 5. Seed admin user and sample customers
-- Admin password: AdminPass123!
-- Demo customer password: password123

INSERT INTO users (name, email, password_hash, loyalty, wallet_balance, loyalty_points, loyalty_tier, role, is_admin, phone)
VALUES
  ('Julius Ochiey', 'ochieyjyulius@gmail.com', crypt('AdminPass123!', gen_salt('bf')), true, 5500.00, 320, 'Gold', 'owner', true, '254712345678')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password_hash, loyalty, wallet_balance, loyalty_points, loyalty_tier, role, is_admin, phone)
VALUES
  ('Demo Customer', 'demo@jiwekee.com', crypt('password123', gen_salt('bf')), true, 3850.00, 480, 'Gold', 'customer', false, '254799000111')
ON CONFLICT (email) DO NOTHING;

-- 6. Seed menu items
INSERT INTO menu_items (name, description, price, category, image_url, is_available, is_featured, prep_time_minutes)
VALUES
  ('Choma Platter', 'Grilled meat platter served with kachumbari.', 850.00, 'Grills', '/images/choma.jpg', true, true, 25),
  ('Swahili Biryani', 'Fragrant basmati rice with coastal spices.', 650.00, 'Swahili Classics', '/images/biryani.jpg', true, true, 20),
  ('Mahamri & Viazi Karai', 'Coastal fried bread with spiced potatoes.', 350.00, 'Swahili Classics', '/images/mahamri.jpg', true, false, 15),
  ('Wood-fired Pizza', 'Stone-baked pizza with fresh toppings.', 900.00, 'Pizza', '/images/pizza.jpg', true, true, 18),
  ('Grilled Fish', 'Whole tilapia grilled and served with ugali.', 750.00, 'Seafood', '/images/fish.jpg', true, false, 22),
  ('Classic Cheesecake', 'Baked cheesecake with passionfruit coulis.', 400.00, 'Desserts', '/images/cheesecake.jpg', true, false, 5)
ON CONFLICT DO NOTHING;

-- 7. Helpful echo
-- Note: If you prefer to create an admin user via the running Node server (so bcrypt parameters match), you can instead run the server and use the /api/auth/signup endpoint.

-- End of seed
