#!/bin/bash
# migrate.sh - Run all database migrations in order
# Usage: ./scripts/migrate.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"

# Verify PostgreSQL connection
if ! psql -c "SELECT 1" > /dev/null 2>&1; then
    echo "Error: Cannot connect to PostgreSQL"
    echo "Ensure PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE are set"
    exit 1
fi

# Run migrations in order
echo "Running migrations..."
for f in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$f" ]; then
        echo "  $(basename "$f")"
        psql -f "$f"
    fi
done

echo "Migrations complete"
