ALTER TABLE users ADD COLUMN IF NOT EXISTS last_transaction TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS wallets (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance       NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency      VARCHAR(10) NOT NULL DEFAULT 'KES',
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                SERIAL PRIMARY KEY,
  wallet_id         INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type  VARCHAR(80) NOT NULL,
  amount            NUMERIC(10, 2) NOT NULL,
  description       TEXT,
  reference_id      VARCHAR(120),
  balance_after     NUMERIC(10, 2) NOT NULL,
  status            VARCHAR(30) NOT NULL DEFAULT 'Completed',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);

\echo 'Wallet schema fix applied.'
