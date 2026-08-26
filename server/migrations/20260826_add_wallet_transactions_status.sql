-- Migration: ensure wallet_transactions table exists and includes a `status` column
BEGIN;

DO $$
BEGIN
  -- If the column already exists, do nothing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'status'
  ) THEN
    RAISE NOTICE 'Column wallet_transactions.status already exists; skipping.';
  ELSE
    -- If the table exists but column missing, alter it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
      ALTER TABLE wallet_transactions ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Completed';
      UPDATE wallet_transactions SET status = 'Completed' WHERE status IS NULL;
      RAISE NOTICE 'Added status column to existing wallet_transactions table.';
    ELSE
      -- Create new table with sensible columns including status
      CREATE TABLE wallet_transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        transaction_type VARCHAR(80) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        description TEXT,
        reference_id VARCHAR(120),
        balance_after NUMERIC(10,2) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Completed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      RAISE NOTICE 'Created wallet_transactions table with status column.';
    END IF;
  END IF;
END $$;

COMMIT;
