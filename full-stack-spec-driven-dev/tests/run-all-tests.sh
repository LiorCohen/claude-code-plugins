#!/bin/bash
# SDD Plugin Test Runner
# Runs all tests and reports summary

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Parse arguments
RUN_FAST=true
RUN_INTEGRATION=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --integration|-i)
            RUN_INTEGRATION=true
            shift
            ;;
        --all|-a)
            RUN_FAST=true
            RUN_INTEGRATION=true
            shift
            ;;
        --fast-only|-f)
            RUN_FAST=true
            RUN_INTEGRATION=false
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --fast-only, -f     Run only fast tests (default)"
            echo "  --integration, -i   Run integration tests (slower)"
            echo "  --all, -a           Run all tests"
            echo "  --verbose, -v       Show verbose output"
            echo "  --help, -h          Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "=========================================="
echo "SDD Plugin Test Suite"
echo "=========================================="
echo "Plugin directory: $PLUGIN_DIR"
echo "Output directory: $TEST_OUTPUT_DIR"
echo ""

# Track overall results
TOTAL_PASSED=0
TOTAL_FAILED=0
declare -a TEST_RESULTS

# Run a test file and capture results
run_test_file() {
    local test_file="$1"
    local test_name=$(basename "$test_file" .sh)

    echo ""
    echo "------------------------------------------"
    echo "Running: $test_name"
    echo "------------------------------------------"

    reset_counters

    if bash "$test_file"; then
        TEST_RESULTS+=("$test_name:PASS")
    else
        TEST_RESULTS+=("$test_name:FAIL")
    fi

    TOTAL_PASSED=$((TOTAL_PASSED + TESTS_PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + TESTS_FAILED))
}

# Run fast tests
if [[ "$RUN_FAST" == "true" ]]; then
    echo ""
    echo "=========================================="
    echo "Running Fast Tests"
    echo "=========================================="

    for test_file in "$SCRIPT_DIR"/fast/test-*.sh; do
        if [[ -f "$test_file" ]]; then
            run_test_file "$test_file"
        fi
    done
fi

# Run integration tests
if [[ "$RUN_INTEGRATION" == "true" ]]; then
    echo ""
    echo "=========================================="
    echo "Running Integration Tests"
    echo "=========================================="
    echo "(These may take 10-30 minutes each)"

    for test_file in "$SCRIPT_DIR"/integration/test-*.sh; do
        if [[ -f "$test_file" ]]; then
            run_test_file "$test_file"
        fi
    done
fi

# Print final summary
echo ""
echo "=========================================="
echo "Final Summary"
echo "=========================================="

for result in "${TEST_RESULTS[@]}"; do
    test_name="${result%:*}"
    status="${result#*:}"
    if [[ "$status" == "PASS" ]]; then
        echo -e "${GREEN}[PASS]${NC} $test_name"
    else
        echo -e "${RED}[FAIL]${NC} $test_name"
    fi
done

echo ""
echo "=========================================="
echo -e "Total Assertions Passed: ${GREEN}$TOTAL_PASSED${NC}"
echo -e "Total Assertions Failed: ${RED}$TOTAL_FAILED${NC}"
echo "=========================================="

if [[ $TOTAL_FAILED -gt 0 ]]; then
    exit 1
fi
exit 0
