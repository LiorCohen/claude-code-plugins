#!/bin/bash
# SDD Plugin Test Helpers
# Common functions for running and validating SDD plugin tests

set -e

# Directories
HELPERS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$HELPERS_DIR/.." && pwd)"
TEST_OUTPUT_DIR="${TEST_OUTPUT_DIR:-/tmp/sdd-tests}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# ------------------------------------------------------------------------------
# Core Functions
# ------------------------------------------------------------------------------

# Determine timeout command (gtimeout on macOS, timeout on Linux)
if command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="gtimeout"
elif command -v timeout &> /dev/null; then
    TIMEOUT_CMD="timeout"
else
    TIMEOUT_CMD=""
fi

# Run Claude with SDD plugin loaded (with live progress feedback)
# Usage: run_claude "prompt" [timeout_seconds] [working_dir]
run_claude() {
    local prompt="$1"
    local timeout_secs="${2:-120}"
    local working_dir="${3:-$(pwd)}"

    local output_file="$TEST_OUTPUT_DIR/output-$(date +%s).json"
    mkdir -p "$TEST_OUTPUT_DIR"

    echo -e "${YELLOW}Running Claude with timeout ${timeout_secs}s in $working_dir...${NC}" >&2

    # Run Claude from the working directory so file operations happen there
    local cmd="cd \"$working_dir\" && claude -p \"$prompt\" \
        --add-dir \"$PLUGIN_DIR\" \
        --permission-mode bypassPermissions \
        --output-format stream-json"

    local exit_code=0

    # Start Claude in background and monitor progress
    if [[ -n "$TIMEOUT_CMD" ]]; then
        $TIMEOUT_CMD "$timeout_secs" bash -c "$cmd" > "$output_file" 2>&1 &
    else
        echo -e "${YELLOW}Warning: No timeout command available, running without timeout${NC}" >&2
        bash -c "$cmd" > "$output_file" 2>&1 &
    fi
    local pid=$!

    # Monitor progress while Claude runs
    local last_size=0
    local tool_count=0
    local last_tool=""
    local elapsed=0

    while kill -0 $pid 2>/dev/null; do
        sleep 2
        elapsed=$((elapsed + 2))

        if [[ -f "$output_file" ]]; then
            local current_size=$(wc -c < "$output_file" 2>/dev/null || echo 0)

            # Check for new tool calls in the output (format: "name":"ToolName" in tool_use blocks)
            local new_tools=$(tail -c $((current_size - last_size)) "$output_file" 2>/dev/null | grep -o '"name":"[^"]*"' | tail -1 | sed 's/"name":"//;s/"//')
            if [[ -n "$new_tools" && "$new_tools" != "$last_tool" ]]; then
                tool_count=$((tool_count + 1))
                last_tool="$new_tools"
                echo -e "  ${YELLOW}[${elapsed}s]${NC} Tool #$tool_count: $new_tools" >&2
            fi

            # Check for agent invocations
            local new_agents=$(tail -c $((current_size - last_size)) "$output_file" 2>/dev/null | grep -o '"subagent_type":"[^"]*"' | tail -1 | sed 's/"subagent_type":"//;s/"//')
            if [[ -n "$new_agents" ]]; then
                echo -e "  ${GREEN}[${elapsed}s]${NC} Agent invoked: $new_agents" >&2
            fi

            last_size=$current_size
        fi

        # Show heartbeat every 30 seconds if no activity
        if [[ $((elapsed % 30)) -eq 0 ]]; then
            echo -e "  ${YELLOW}[${elapsed}s]${NC} Still running... (output: ${last_size} bytes)" >&2
        fi
    done

    # Get exit code
    wait $pid
    exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        echo -e "${RED}Claude exited with code $exit_code after ${elapsed}s${NC}" >&2
    else
        echo -e "${GREEN}Claude completed in ${elapsed}s${NC}" >&2
    fi

    # Output the full result for capture
    cat "$output_file"
    return $exit_code
}

# Run Claude and capture output to a variable (progress goes to stderr, output to stdout)
# Usage: output=$(run_claude_capture "prompt" [timeout] [working_dir])
run_claude_capture() {
    local prompt="$1"
    local timeout_secs="${2:-120}"
    local working_dir="${3:-$(pwd)}"

    # Progress messages go to stderr (visible), JSON output goes to stdout (captured)
    run_claude "$prompt" "$timeout_secs" "$working_dir"
}

# ------------------------------------------------------------------------------
# Assertion Functions
# ------------------------------------------------------------------------------

# Assert that output contains a pattern
# Usage: assert_contains "$output" "pattern" "description"
assert_contains() {
    local output="$1"
    local pattern="$2"
    local description="${3:-Output contains '$pattern'}"

    if echo "$output" | grep -q "$pattern"; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Expected pattern: $pattern"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert that output does NOT contain a pattern
# Usage: assert_not_contains "$output" "pattern" "description"
assert_not_contains() {
    local output="$1"
    local pattern="$2"
    local description="${3:-Output does not contain '$pattern'}"

    if ! echo "$output" | grep -q "$pattern"; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Unexpected pattern found: $pattern"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert that a specific agent was invoked via Task tool
# Usage: assert_agent_used "$output" "agent-name" "description"
assert_agent_used() {
    local output="$1"
    local agent_name="$2"
    local description="${3:-Agent '$agent_name' was invoked}"

    # Look for Task tool invocation with this agent in subagent_type
    if echo "$output" | grep -qE "\"subagent_type\"[[:space:]]*:[[:space:]]*\"$agent_name\""; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Agent '$agent_name' was not found in Task tool invocations"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert that agents were used in a specific order
# Usage: assert_agent_order "$output" "first-agent" "second-agent"
assert_agent_order() {
    local output="$1"
    local first_agent="$2"
    local second_agent="$3"
    local description="${4:-Agent '$first_agent' invoked before '$second_agent'}"

    local first_line=$(echo "$output" | grep -n "\"subagent_type\"[[:space:]]*:[[:space:]]*\"$first_agent\"" | head -1 | cut -d: -f1)
    local second_line=$(echo "$output" | grep -n "\"subagent_type\"[[:space:]]*:[[:space:]]*\"$second_agent\"" | head -1 | cut -d: -f1)

    if [[ -z "$first_line" ]]; then
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Agent '$first_agent' not found"
        ((TESTS_FAILED++))
        return 1
    fi

    if [[ -z "$second_line" ]]; then
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Agent '$second_agent' not found"
        ((TESTS_FAILED++))
        return 1
    fi

    if [[ "$first_line" -lt "$second_line" ]]; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  '$first_agent' (line $first_line) should come before '$second_agent' (line $second_line)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert that a file exists
# Usage: assert_file_exists "/path/to/dir" "relative/path/to/file"
assert_file_exists() {
    local base_dir="$1"
    local file_path="$2"
    local description="${3:-File exists: $file_path}"

    if [[ -f "$base_dir/$file_path" ]]; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  File not found: $base_dir/$file_path"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert that a directory exists
# Usage: assert_dir_exists "/path/to/dir" "relative/path"
assert_dir_exists() {
    local base_dir="$1"
    local dir_path="$2"
    local description="${3:-Directory exists: $dir_path}"

    if [[ -d "$base_dir/$dir_path" ]]; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Directory not found: $base_dir/$dir_path"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert that a file contains a pattern
# Usage: assert_file_contains "/path/to/dir" "file.txt" "pattern"
assert_file_contains() {
    local base_dir="$1"
    local file_path="$2"
    local pattern="$3"
    local description="${4:-File '$file_path' contains '$pattern'}"

    if [[ ! -f "$base_dir/$file_path" ]]; then
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  File not found: $base_dir/$file_path"
        ((TESTS_FAILED++))
        return 1
    fi

    if grep -q "$pattern" "$base_dir/$file_path"; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Pattern '$pattern' not found in $file_path"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert command succeeds
# Usage: assert_command_succeeds "npm install" "/path/to/dir"
assert_command_succeeds() {
    local command="$1"
    local working_dir="${2:-.}"
    local description="${3:-Command succeeds: $command}"

    if (cd "$working_dir" && eval "$command" > /dev/null 2>&1); then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Command failed in $working_dir"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Assert HTTP endpoint responds
# Usage: assert_http_responds "http://localhost:3000/health" "200"
assert_http_responds() {
    local url="$1"
    local expected_code="${2:-200}"
    local description="${3:-HTTP $url responds with $expected_code}"

    local actual_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [[ "$actual_code" == "$expected_code" ]]; then
        echo -e "${GREEN}[PASS]${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $description"
        echo "  Expected: $expected_code, Got: $actual_code"
        ((TESTS_FAILED++))
        return 1
    fi
}

# ------------------------------------------------------------------------------
# Test Project Management
# ------------------------------------------------------------------------------

# Create a clean test project directory
# Usage: test_dir=$(setup_test_project "test-name")
setup_test_project() {
    local name="$1"
    local dir="$TEST_OUTPUT_DIR/$name-$(date +%s)"
    mkdir -p "$dir"
    echo "$dir"
}

# Cleanup test project
# Usage: cleanup_test_project "$test_dir"
cleanup_test_project() {
    local dir="$1"
    if [[ -n "$dir" && "$dir" == "$TEST_OUTPUT_DIR"* ]]; then
        rm -rf "$dir"
    fi
}

# ------------------------------------------------------------------------------
# Summary Functions
# ------------------------------------------------------------------------------

# Print test summary
print_summary() {
    local total=$((TESTS_PASSED + TESTS_FAILED))
    echo ""
    echo "=========================================="
    echo "Test Summary"
    echo "=========================================="
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo "Total:  $total"
    echo "=========================================="

    if [[ $TESTS_FAILED -gt 0 ]]; then
        return 1
    fi
    return 0
}

# Reset test counters
reset_counters() {
    TESTS_PASSED=0
    TESTS_FAILED=0
}

# Export functions for use in subshells
export -f run_claude run_claude_capture
export -f assert_contains assert_not_contains assert_agent_used assert_agent_order
export -f assert_file_exists assert_dir_exists assert_file_contains
export -f assert_command_succeeds assert_http_responds
export -f setup_test_project cleanup_test_project
export -f print_summary reset_counters
export PLUGIN_DIR TEST_OUTPUT_DIR
