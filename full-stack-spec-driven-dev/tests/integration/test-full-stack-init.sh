#!/bin/bash
# Integration Test: Full-Stack Project Init
# Creates a project with /sdd-init and verifies it builds and runs

set -e
set -o pipefail  # Ensure pipe returns exit code of failed command, not tee

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-helpers.sh"

echo "Integration Test: Full-Stack project builds and runs"
echo ""
echo "WARNING: This test takes 10-30 minutes and requires npm"
echo ""

# Setup
TEST_PROJECT=$(setup_test_project "integration-fullstack")
PROMPT=$(cat "$SCRIPT_DIR/../prompts/sdd-init-fullstack.txt")

echo "Test project directory: $TEST_PROJECT"
echo ""

# Step 1: Run /sdd-init
echo "Step 1: Running /sdd-init..."
echo "=========================================="
OUTPUT=$(run_claude_capture "$PROMPT" 600 "$TEST_PROJECT")
echo "$OUTPUT" > "$TEST_PROJECT/claude-output.json"

# Check if project was created in a subdirectory
# The prompt specifies "test-fullstack-project" as the project name
if [ -d "$TEST_PROJECT/test-fullstack-project" ]; then
    echo "Project created in subdirectory, updating TEST_PROJECT path..."
    TEST_PROJECT="$TEST_PROJECT/test-fullstack-project"
fi

# Verify basic structure
assert_dir_exists "$TEST_PROJECT" "components/server" "Server component created"
assert_dir_exists "$TEST_PROJECT" "components/webapp" "Webapp component created"
assert_file_exists "$TEST_PROJECT" "package.json" "Root package.json exists"

echo ""
echo "Step 2: Installing dependencies..."
echo "=========================================="

# Install dependencies
cd "$TEST_PROJECT"
if npm install --workspaces 2>&1 | tee "$TEST_PROJECT/npm-install.log"; then
    echo -e "${GREEN}[PASS]${NC} npm install succeeded"
    ((TESTS_PASSED++))
else
    echo -e "${RED}[FAIL]${NC} npm install failed"
    ((TESTS_FAILED++))
    print_summary
    exit 1
fi

echo ""
echo "Step 3: Building server..."
echo "=========================================="

cd "$TEST_PROJECT/components/server"
if npm run build 2>&1 | tee "$TEST_PROJECT/server-build.log"; then
    echo -e "${GREEN}[PASS]${NC} Server build succeeded"
    ((TESTS_PASSED++))
else
    echo -e "${RED}[FAIL]${NC} Server build failed"
    ((TESTS_FAILED++))
fi

echo ""
echo "Step 4: Building webapp..."
echo "=========================================="

cd "$TEST_PROJECT/components/webapp"
if npm run build 2>&1 | tee "$TEST_PROJECT/webapp-build.log"; then
    echo -e "${GREEN}[PASS]${NC} Webapp build succeeded"
    ((TESTS_PASSED++))
else
    echo -e "${RED}[FAIL]${NC} Webapp build failed"
    ((TESTS_FAILED++))
fi

echo ""
echo "Step 5: Starting server and testing health endpoint..."
echo "=========================================="

cd "$TEST_PROJECT/components/server"

# Start server in background
npm run dev > "$TEST_PROJECT/server.log" 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start (PID: $SERVER_PID)..."
sleep 5

# Test health endpoint
if curl -s http://localhost:3000/health | grep -q '"status":"ok"'; then
    echo -e "${GREEN}[PASS]${NC} Server /health endpoint responds correctly"
    ((TESTS_PASSED++))
else
    echo -e "${RED}[FAIL]${NC} Server /health endpoint did not respond"
    ((TESTS_FAILED++))
fi

# Cleanup server
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "Step 6: Type checking..."
echo "=========================================="

cd "$TEST_PROJECT/components/server"
if npm run typecheck 2>&1 | tee "$TEST_PROJECT/server-typecheck.log"; then
    echo -e "${GREEN}[PASS]${NC} Server typecheck passed"
    ((TESTS_PASSED++))
else
    echo -e "${RED}[FAIL]${NC} Server typecheck failed"
    ((TESTS_FAILED++))
fi

cd "$TEST_PROJECT/components/webapp"
if npm run typecheck 2>&1 | tee "$TEST_PROJECT/webapp-typecheck.log"; then
    echo -e "${GREEN}[PASS]${NC} Webapp typecheck passed"
    ((TESTS_PASSED++))
else
    echo -e "${RED}[FAIL]${NC} Webapp typecheck failed"
    ((TESTS_FAILED++))
fi

echo ""
echo "Cleanup..."
echo "Test artifacts saved in: $TEST_PROJECT"
# cleanup_test_project "$TEST_PROJECT"

print_summary
