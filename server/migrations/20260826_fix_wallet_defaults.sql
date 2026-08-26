-- Migration: set wallets.balance default to 0.00 and fix existing incorrect balances
BEGIN;

-- Ensure the wallets table exists before altering
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
    -- Set sensible default and non-negative constraint if not present
    ALTER TABLE wallets ALTER COLUMN balance SET DEFAULT 0.00;
    -- Optional: ensure non-negative
    -- Note: adding a CHECK may fail if existing data violates it; we avoid adding the CHECK here.

    -- Fix any wallet rows that were mistakenly seeded with 1000 (legacy test data)
    UPDATE wallets SET balance = 0.00 WHERE balance = 1000;
  ELSE
    RAISE NOTICE 'Table wallets does not exist; skipping wallet default migration.';
  END IF;
END $$;

COMMIT;
