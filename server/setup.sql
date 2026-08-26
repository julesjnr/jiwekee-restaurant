-- Jiwekee Restaurant — full setup script
-- Run with: sudo -u postgres psql -f setup.sql

-- 1. Create the database (skip if it already exists)
SELECT 'CREATE DATABASE jiwekee_restaurant'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'jiwekee_restaurant')\gexec

-- 2. Connect to it
\c jiwekee_restaurant

-- 3. Tables
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  loyalty         BOOLEAN NOT NULL DEFAULT FALSE,
  wallet_balance  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  description     TEXT,
  price           NUMERIC(10, 2) NOT NULL,
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          NUMERIC(10, 2) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending | Paid | Failed
  payment_method  VARCHAR(20) NOT NULL DEFAULT 'mpesa',   -- mpesa | wallet
  checkout_id     VARCHAR(60),                            -- M-Pesa CheckoutRequestID
  mpesa_receipt   VARCHAR(60),
  phone_number    VARCHAR(20),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    INTEGER NOT NULL REFERENCES menu_items(id),
  quantity        INTEGER NOT NULL,
  unit_price      NUMERIC(10, 2) NOT NULL
);

-- 4. Seed menu
INSERT INTO menu_items (name, description, price, image_url) VALUES
  ('Choma Platter', 'Grilled meat platter served with kachumbari.', 850, '/images/choma.jpg'),
  ('Biryani', 'Spiced rice with tender beef or chicken.', 650, '/images/biryani.jpg'),
  ('Mahamri & Viazi Karai', 'Coastal fried bread with spiced potatoes.', 350, '/images/mahamri.jpg'),
  ('Wood-fired Pizza', 'Stone-baked pizza with fresh toppings.', 900, '/images/pizza.jpg'),
  ('Grilled Fish', 'Whole tilapia grilled and served with ugali.', 750, '/images/fish.jpg'),
  ('Cheesecake', 'Classic baked cheesecake slice.', 400, '/images/cheesecake.jpg')
ON CONFLICT DO NOTHING;

\echo 'Setup complete: database, tables, and menu seed all ready.'
