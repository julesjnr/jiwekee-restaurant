#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo is required. This script temporarily sets local/host auth to 'trust',
# runs the DB seed, then restores the original pg_hba.conf.

echo "Locating pg_hba.conf..."
PG_HBA=$(psql -t -c "SHOW hba_file;" | tr -d '[:space:]')
if [ -z "$PG_HBA" ]; then
  echo "Could not locate pg_hba.conf (psql SHOW hba_file returned empty)." >&2
  exit 1
fi

echo "pg_hba.conf found at: $PG_HBA"
BACKUP="${PG_HBA}.jiwekee.bak"
echo "Backing up to: $BACKUP"
sudo cp "$PG_HBA" "$BACKUP"

echo "Writing temporary pg_hba.conf with trust for local connections..."
sudo awk '
  BEGIN{ OFS=FS=" " }
  /^local[[:space:]]+all[[:space:]]+all/ { $4="trust"; print; next }
  /^host[[:space:]]+all[[:space:]]+all[[:space:]]+127\.0\.0\.1\/32/ { $5="trust"; print; next }
  /^host[[:space:]]+all[[:space:]]+all[[:space:]]+::1\/128/ { $5="trust"; print; next }
  { print }
' "$PG_HBA" | sudo tee "$PG_HBA" >/dev/null

echo "Restarting PostgreSQL..."
sudo systemctl restart postgresql

echo "Running DB seed: server/db_init_and_seed.sql"
psql -d jiwekee_restaurant -f server/db_init_and_seed.sql

echo "Seed complete — restoring original pg_hba.conf"
sudo mv "$BACKUP" "$PG_HBA"
sudo systemctl restart postgresql

echo "Verifying counts..."
psql -d jiwekee_restaurant -c "SELECT COUNT(*) AS users_count FROM users;"
psql -d jiwekee_restaurant -c "SELECT COUNT(*) AS menu_items_count FROM menu_items;"

echo "Done. The pg_hba.conf was restored."
