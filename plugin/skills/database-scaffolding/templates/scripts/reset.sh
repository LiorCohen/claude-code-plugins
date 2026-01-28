#!/bin/bash
# reset.sh - Reset database: drop, recreate, migrate, and seed
# Usage: ./scripts/reset.sh
# WARNING: This will delete all data in the database!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Safety check
if [ -z "$PGDATABASE" ]; then
    echo "Error: PGDATABASE environment variable not set"
    exit 1
fi

echo "WARNING: This will delete all data in '$PGDATABASE'"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
fi

echo "Dropping database '$PGDATABASE'..."
dropdb --if-exists "$PGDATABASE"

echo "Creating database '$PGDATABASE'..."
createdb "$PGDATABASE"

echo "Running migrations..."
"$SCRIPT_DIR/migrate.sh"

echo "Running seeds..."
"$SCRIPT_DIR/seed.sh"

echo "Database reset complete"
