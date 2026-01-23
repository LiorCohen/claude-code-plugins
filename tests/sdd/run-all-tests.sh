#!/bin/bash
# SDD Plugin Test Runner
# Runs all tests using uv and pytest

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
RUN_INTEGRATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --integration|-i)
            RUN_INTEGRATION=true
            shift
            ;;
        --all|-a)
            RUN_INTEGRATION=true
            shift
            ;;
        --fast-only|-f)
            RUN_INTEGRATION=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --fast-only, -f     Run only fast tests (default)"
            echo "  --integration, -i   Include integration tests (slower)"
            echo "  --all, -a           Run all tests"
            echo "  --help, -h          Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$SCRIPT_DIR"

echo "=========================================="
echo "SDD Plugin Test Suite"
echo "=========================================="
echo ""

# Run pytest with uv
if [[ "$RUN_INTEGRATION" == "true" ]]; then
    echo "Running all tests (including integration)..."
    echo ""
    uv run pytest
else
    echo "Running fast tests only..."
    echo "(Use --integration or --all to include integration tests)"
    echo ""
    uv run pytest -m "not slow" fast/
fi
