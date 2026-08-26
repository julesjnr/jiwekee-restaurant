-- db_init_and_seed_full.sql
-- Jiwekee Restaurant: Complete schema setup, migration and seed data
-- Database: PostgreSQL (jiwekee_restaurant)

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

ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
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
  status        VARCHAR(30) NOT NULL DEFAULT 'Available',
  section       VARCHAR(50) NOT NULL DEFAULT 'Main Dining',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
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

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount              NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status              VARCHAR(20) NOT NULL DEFAULT 'Pending',
  fulfillment_status  VARCHAR(30) NOT NULL DEFAULT 'Confirmed',
  payment_method      VARCHAR(20) NOT NULL DEFAULT 'mpesa',
  order_type          VARCHAR(20) NOT NULL DEFAULT 'Dine-In',
  table_number        VARCHAR(20),
  delivery_address    TEXT,
  notes               TEXT,
  checkout_id         VARCHAR(100),
  mpesa_receipt       VARCHAR(60),
  phone_number        VARCHAR(30),
  points_earned       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
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
  special_instructions  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name VARCHAR(120);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
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
  status            VARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 8. Payments
CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  payment_method  VARCHAR(50) NOT NULL,
  amount          NUMERIC(10, 2) NOT NULL,
  payment_status  VARCHAR(50) NOT NULL DEFAULT 'Pending',
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
  unit              VARCHAR(20) NOT NULL DEFAULT 'kg',
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
  type        VARCHAR(30) NOT NULL DEFAULT 'info',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  link_url    VARCHAR(200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compatibility view
CREATE OR REPLACE VIEW tables AS
  SELECT id, table_number, capacity, status, section, created_at, updated_at
  FROM restaurant_tables;

-- ============================================================================
-- SEED DATA (Idempotent)
-- ============================================================================

-- 1. Seed Categories
INSERT INTO categories (name, description) VALUES
  ('Grills', 'Open charcoal flame grilled meats and barbecue specialities'),
  ('Swahili Classics', 'Coastal Kenya spices, fragrant rice and traditional pastries'),
  ('Pizza', 'Stone-fired thin crust artisan pizzas with fresh toppings'),
  ('Seafood', 'Lake Victoria fresh tilapia and coastal catches'),
  ('Desserts', 'Velvety cakes and decadent sweet finishes'),
  ('Beverages', 'Fresh pressed juices, mocktails and hot brews')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Seed Users with Secure Crypt Hashing
-- Password for all demo accounts: password123 (and Admin123! for admin@jiwekee.com and staff)
INSERT INTO users (name, email, password_hash, loyalty, wallet_balance, loyalty_points, loyalty_tier, role, is_admin, phone)
VALUES
  ('Julius Ochiey', 'ochieyjyulius@gmail.com', crypt('password123', gen_salt('bf', 10)), true, 5500.00, 320, 'Gold', 'owner', true, '254712345678'),
  ('Jiwekee Administrator', 'admin@jiwekee.com', crypt('Admin123!', gen_salt('bf', 10)), true, 10000.00, 500, 'Platinum', 'owner', true, '254700000001'),
  ('Sarah Mwangi', 'manager@jiwekee.com', crypt('Admin123!', gen_salt('bf', 10)), true, 2000.00, 150, 'Silver', 'manager', true, '254722111222'),
  ('Chef Otieno', 'chef@jiwekee.com', crypt('Admin123!', gen_salt('bf', 10)), false, 0.00, 0, 'Bronze', 'kitchen', false, '254733444555'),
  ('Amina Hassan', 'cashier@jiwekee.com', crypt('Admin123!', gen_salt('bf', 10)), false, 0.00, 0, 'Bronze', 'cashier', false, '254744555666'),
  ('Daniel Kariuki', 'waiter@jiwekee.com', crypt('Admin123!', gen_salt('bf', 10)), false, 0.00, 0, 'Bronze', 'waiter', false, '254755666777'),
  ('Grace Wanjiru', 'accountant@jiwekee.com', crypt('Admin123!', gen_salt('bf', 10)), false, 0.00, 0, 'Bronze', 'accountant', false, '254766777888'),
  ('David Kimani', 'demo@jiwekee.com', crypt('password123', gen_salt('bf', 10)), true, 3850.00, 480, 'Gold', 'customer', false, '254799000111')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_admin = EXCLUDED.is_admin,
  wallet_balance = EXCLUDED.wallet_balance;

-- 3. Seed Menu Items
INSERT INTO menu_items (category_id, name, description, price, category, image_url, is_available, is_featured, prep_time_minutes)
VALUES
  ((SELECT id FROM categories WHERE name = 'Grills' LIMIT 1), 'Choma Platter', 'Grilled goat & beef cuts served with spicy kachumbari and ugali.', 850.00, 'Grills', '/images/choma.jpg', true, true, 25),
  ((SELECT id FROM categories WHERE name = 'Swahili Classics' LIMIT 1), 'Swahili Biryani', 'Fragrant basmati rice infused with coastal spices and tender beef.', 650.00, 'Swahili Classics', '/images/biryani.jpg', true, true, 20),
  ((SELECT id FROM categories WHERE name = 'Swahili Classics' LIMIT 1), 'Mahamri & Viazi Karai', 'Fluffy coconut-cardamom pastries paired with crispy battered potatoes and coconut chutney.', 350.00, 'Swahili Classics', '/images/mahamri.jpg', true, false, 15),
  ((SELECT id FROM categories WHERE name = 'Pizza' LIMIT 1), 'Wood-fired Pizza', 'Artisan crust topped with smoked beef sausage, mozzarella, and garden herbs.', 900.00, 'Pizza', '/images/pizza.jpg', true, true, 18),
  ((SELECT id FROM categories WHERE name = 'Seafood' LIMIT 1), 'Crispy Grilled Fish', 'Whole lake Victoria tilapia, dry-rub seasoned, served with sukuma wiki & ugali.', 750.00, 'Seafood', '/images/fish.jpg', true, false, 22),
  ((SELECT id FROM categories WHERE name = 'Desserts' LIMIT 1), 'Classic Cheesecake', 'Velvety baked New York style cheesecake with tropical passionfruit coulis.', 400.00, 'Desserts', '/images/cheesecake.jpg', true, false, 5)
ON CONFLICT (name) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_available = EXCLUDED.is_available,
  is_featured = EXCLUDED.is_featured,
  prep_time_minutes = EXCLUDED.prep_time_minutes;

-- 4. Seed Restaurant Tables
INSERT INTO restaurant_tables (table_number, capacity, status, section)
VALUES
  ('T-01', 2, 'Occupied', 'Main Dining'),
  ('T-02', 4, 'Available', 'Main Dining'),
  ('T-03', 4, 'Reserved', 'Terrace Garden'),
  ('T-04', 6, 'Occupied', 'Terrace Garden'),
  ('T-05', 8, 'Available', 'VIP Lounge'),
  ('T-06', 2, 'Maintenance', 'Balcony')
ON CONFLICT (table_number) DO UPDATE SET
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status,
  section = EXCLUDED.section;

-- 5. Seed Inventory Items
INSERT INTO inventory_items (name, unit, current_quantity, min_stock_level, unit_cost, supplier, last_restocked)
VALUES
  ('Goat Meat & Beef Cuts', 'kg', 42.50, 15.00, 620.00, 'Nairobi Meat Wholesalers', now() - INTERVAL '1 day'),
  ('Basmati Rice', 'kg', 65.00, 20.00, 210.00, 'Coast Grain Millers', now() - INTERVAL '3 days'),
  ('Tilapia Fresh Fish', 'pcs', 18.00, 10.00, 380.00, 'Lake Basin Fisheries', now() - INTERVAL '1 day'),
  ('Mozzarella Cheese', 'kg', 8.50, 10.00, 950.00, 'Highland Dairy Products', now() - INTERVAL '5 days'),
  ('Potatoes (Shangi)', 'kg', 85.00, 30.00, 80.00, 'Nyandarua Farmers Direct', now() - INTERVAL '2 days'),
  ('Coconut Milk & Spice Pack', 'L', 4.20, 8.00, 280.00, 'Mombasa Spice Trading', now() - INTERVAL '4 days'),
  ('Cooking Oil & Clarified Butter', 'L', 35.00, 15.00, 340.00, 'Bidco Refineries', now() - INTERVAL '6 days')
ON CONFLICT (name) DO UPDATE SET
  current_quantity = EXCLUDED.current_quantity,
  min_stock_level = EXCLUDED.min_stock_level,
  unit_cost = EXCLUDED.unit_cost;

-- 6. Ensure order_items have correct foreign key and sample orders
DO $$
DECLARE
  v_cust_id INTEGER;
  v_order_id INTEGER;
BEGIN
  SELECT id INTO v_cust_id FROM users WHERE email = 'demo@jiwekee.com' LIMIT 1;
  IF v_cust_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM orders) THEN
    -- Order 1: Dine-In Paid
    INSERT INTO orders (id, user_id, amount, status, fulfillment_status, payment_method, order_type, table_number, notes, phone_number, checkout_id, mpesa_receipt, points_earned, created_at)
    VALUES (101, v_cust_id, 1500.00, 'Paid', 'Completed', 'mpesa', 'Dine-In', 'T-01', 'Extra kachumbari on the side please', '254799000111', 'WS-101-9988', 'QHD782K9P1', 15, now() - INTERVAL '5 hours')
    RETURNING id INTO v_order_id;

    INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price)
    VALUES
      (v_order_id, (SELECT id FROM menu_items WHERE name='Choma Platter' LIMIT 1), 'Choma Platter', 1, 850.00),
      (v_order_id, (SELECT id FROM menu_items WHERE name='Swahili Biryani' LIMIT 1), 'Swahili Biryani', 1, 650.00);

    INSERT INTO payments (order_id, user_id, payment_method, amount, payment_status, transaction_id, phone_number)
    VALUES (v_order_id, v_cust_id, 'mpesa', 1500.00, 'Completed', 'QHD782K9P1', '254799000111');

    -- Order 2: Wallet Paid
    INSERT INTO orders (id, user_id, amount, status, fulfillment_status, payment_method, order_type, table_number, notes, phone_number, points_earned, created_at)
    VALUES (102, 1, 1250.00, 'Paid', 'Ready', 'wallet', 'Dine-In', 'T-04', 'Table 4 special lunch', '254712345678', 12, now() - INTERVAL '2 hours')
    RETURNING id INTO v_order_id;

    INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price)
    VALUES
      (v_order_id, (SELECT id FROM menu_items WHERE name='Wood-fired Pizza' LIMIT 1), 'Wood-fired Pizza', 1, 900.00),
      (v_order_id, (SELECT id FROM menu_items WHERE name='Mahamri & Viazi Karai' LIMIT 1), 'Mahamri & Viazi Karai', 1, 350.00);

    INSERT INTO payments (order_id, user_id, payment_method, amount, payment_status, transaction_id, phone_number)
    VALUES (v_order_id, 1, 'wallet', 1250.00, 'Completed', 'WALLET-TXN-102', '254712345678');

    -- Order 3: Takeaway Paid
    INSERT INTO orders (id, user_id, amount, status, fulfillment_status, payment_method, order_type, notes, phone_number, checkout_id, mpesa_receipt, points_earned, created_at)
    VALUES (103, v_cust_id, 1150.00, 'Paid', 'Preparing', 'mpesa', 'Takeaway', 'Pack chilli sauce separately', '254799000111', 'WS-103-5544', 'QHE348M7L2', 11, now() - INTERVAL '30 minutes')
    RETURNING id INTO v_order_id;

    INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price)
    VALUES
      (v_order_id, (SELECT id FROM menu_items WHERE name='Crispy Grilled Fish' LIMIT 1), 'Crispy Grilled Fish', 1, 750.00),
      (v_order_id, (SELECT id FROM menu_items WHERE name='Classic Cheesecake' LIMIT 1), 'Classic Cheesecake', 1, 400.00);

    INSERT INTO payments (order_id, user_id, payment_method, amount, payment_status, transaction_id, phone_number)
    VALUES (v_order_id, v_cust_id, 'mpesa', 1150.00, 'Completed', 'QHE348M7L2', '254799000111');

    -- Order 4: Delivery Pending
    INSERT INTO orders (id, user_id, amount, status, fulfillment_status, payment_method, order_type, delivery_address, notes, phone_number, checkout_id, points_earned, created_at)
    VALUES (104, v_cust_id, 850.00, 'Pending', 'Confirmed', 'mpesa', 'Delivery', 'Kilimani Heights Apt 4B, Wood Avenue', 'Ring bell twice on arrival', '254799000111', 'MOCK-104-LIVE', 8, now() - INTERVAL '10 minutes')
    RETURNING id INTO v_order_id;

    INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price)
    VALUES
      (v_order_id, (SELECT id FROM menu_items WHERE name='Choma Platter' LIMIT 1), 'Choma Platter', 1, 850.00);

    INSERT INTO payments (order_id, user_id, payment_method, amount, payment_status, transaction_id, phone_number)
    VALUES (v_order_id, v_cust_id, 'mpesa', 850.00, 'Pending', 'MOCK-104-LIVE', '254799000111');

    -- Fix sequence after explicit order ids
    PERFORM setval('orders_id_seq', 105, true);
    PERFORM setval('order_items_id_seq', (SELECT MAX(id) FROM order_items), true);
  END IF;
END $$;

-- 7. Seed Sample Reservations if empty
DO $$
DECLARE
  v_cust_id INTEGER;
BEGIN
  SELECT id INTO v_cust_id FROM users WHERE email = 'demo@jiwekee.com' LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM reservations) THEN
    INSERT INTO reservations (user_id, customer_name, phone, email, reservation_date, reservation_time, guests_count, table_id, table_number, special_requests, status, created_at)
    VALUES
      (v_cust_id, 'David Kimani', '254799000111', 'demo@jiwekee.com', CURRENT_DATE, '19:30', 4, (SELECT id FROM restaurant_tables WHERE table_number='T-03' LIMIT 1), 'T-03', 'Window side or terrace seating for anniversary dinner.', 'Confirmed', now() - INTERVAL '1 day'),
      (NULL, 'Dr. Angela Wanjala', '254700112233', 'angela.w@outlook.com', CURRENT_DATE + 1, '20:00', 6, (SELECT id FROM restaurant_tables WHERE table_number='T-05' LIMIT 1), 'T-05', 'VIP Lounge dinner meeting with projector access.', 'Pending', now() - INTERVAL '4 hours');
  END IF;
END $$;

-- 8. Seed Sample Audit Logs if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM audit_logs) THEN
    INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details, created_at)
    VALUES
      (1, 'Julius Ochiey', 'MENU_UPDATE', 'menu_items', '1', 'Updated Choma Platter preparation time to 25 mins', now() - INTERVAL '8 hours'),
      (2, 'Sarah Mwangi', 'RESERVATION_CONFIRMED', 'reservations', '1', 'Confirmed table T-03 reservation for David Kimani', now() - INTERVAL '6 hours'),
      (3, 'Chef Otieno', 'ORDER_STATUS_CHANGED', 'orders', '102', 'Transitioned Order #102 fulfillment status to Ready', now() - INTERVAL '1 hour');
  END IF;
END $$;

-- 9. Seed Sample System Notifications if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM system_notifications) THEN
    INSERT INTO system_notifications (title, message, type, is_read, link_url, created_at)
    VALUES
      ('New Table Reservation', 'Dr. Angela Wanjala requested VIP Lounge table for 6 guests tomorrow at 20:00.', 'reservation', false, '/admin?tab=reservations', now() - INTERVAL '4 hours'),
      ('Low Stock Alert: Coconut Milk', 'Coconut Milk & Spice Pack is at 4.2 L (minimum threshold is 8.0 L).', 'inventory', false, '/admin?tab=inventory', now() - INTERVAL '2 hours'),
      ('New Incoming Order #104', 'Customer David Kimani placed a Delivery order for KES 850.00.', 'order', false, '/admin?tab=orders', now() - INTERVAL '10 minutes');
  END IF;
END $$;
