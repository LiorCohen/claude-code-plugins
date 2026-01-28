#!/bin/bash
# seed.sh - Run all database seed files in order
# Usage: ./scripts/seed.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEEDS_DIR="$SCRIPT_DIR/../seeds"

# Verify PostgreSQL connection
if ! psql -c "SELECT 1" > /dev/null 2>&1; then
    echo "Error: Cannot connect to PostgreSQL"
    echo "Ensure PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE are set"
    exit 1
fi

# Run seeds in order
echo "Running seeds..."
for f in "$SEEDS_DIR"/*.sql; do
    if [ -f "$f" ]; then
        echo "  $(basename "$f")"
        psql -f "$f"
    fi
done

echo "Seeding complete"
