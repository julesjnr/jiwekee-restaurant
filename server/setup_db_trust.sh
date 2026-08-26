#!/usr/bin/env bash
set -euo pipefail

# setup_db_trust.sh
# Safely enable temporary 'trust' auth, run DB init+seed, then restore pg_hba.conf.
# Usage: ./setup_db_trust.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/db_init_and_seed_full.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: SQL file not found: $SQL_FILE" >&2
  exit 2
fi

timestamp() { date +"%Y%m%d-%H%M%S"; }

ensure_root() {
  if [ "$EUID" -ne 0 ]; then
    echo "Re-launching with sudo to modify system PostgreSQL config..."
    exec sudo bash "$0" "$@"
  fi
}

echo "== Jiwekee DB Setup (temporary trust) =="
ensure_root

echo "Locating pg_hba.conf..."
PG_HBA="$(psql -t -c "SHOW hba_file;" | tr -d '[:space:]')"
if [ -z "$PG_HBA" ]; then
  echo "Could not determine pg_hba.conf path." >&2
  exit 3
fi
echo "pg_hba.conf: $PG_HBA"

BACKUP="${PG_HBA}.$(timestamp).bak"
if [ -f "$BACKUP" ]; then
  echo "Backup already exists: $BACKUP";
else
  echo "Backing up $PG_HBA -> $BACKUP"
  cp "$PG_HBA" "$BACKUP"
fi

echo "Creating temporary pg_hba.conf with 'trust' for local/host entries..."
TMP_FILE="${PG_HBA}.tmp"

# Process file: replace local and host lines for loopback addresses to use 'trust'
awk '
  BEGIN{ OFS=FS="\t" }
  { line=$0 }
  /^\s*local\s+all\s+all/ { sub(/\S+\s*$/, "trust", $0); print; next }
  /^\s*host\s+all\s+all\s+127\.0\.0\.1\/32/ { sub(/\S+\s*$/, "trust", $0); print; next }
  /^\s*host\s+all\s+all\s+::1\/128/ { sub(/\S+\s*$/, "trust", $0); print; next }
  { print }
' "$PG_HBA" > "$TMP_FILE"

echo "Replacing $PG_HBA (sudo required)"
mv "$TMP_FILE" "$PG_HBA"

echo "Restarting PostgreSQL to apply changes..."
systemctl restart postgresql

echo "Running SQL seed: $SQL_FILE"
psql -d jiwekee_restaurant -f "$SQL_FILE"

echo "SQL seed finished. Restoring original pg_hba.conf backup: $BACKUP"
mv "$BACKUP" "$PG_HBA"
echo "Restarting PostgreSQL to restore secure auth..."
systemctl restart postgresql

echo "Verifying tables and counts..."
psql -d jiwekee_restaurant -c "SELECT COUNT(*) AS users_count FROM users;"
psql -d jiwekee_restaurant -c "SELECT COUNT(*) AS menu_items_count FROM menu_items;"

echo "Testing connection as role 'jiwekee_restaurant' (password taken from environment or default)..."
if psql "postgresql://jiwekee_restaurant:jiwekee123@localhost:5432/jiwekee_restaurant" -c "SELECT 1;" >/dev/null 2>&1; then
  echo "Connection test as jiwekee_restaurant succeeded.";
else
  echo "WARNING: connection as jiwekee_restaurant failed. Check role/password or grants.";
fi

echo "Done. pg_hba.conf restored and DB seeded."
