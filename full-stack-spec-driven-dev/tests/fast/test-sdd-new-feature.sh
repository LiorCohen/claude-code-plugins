#!/bin/bash
# Test: /sdd-new-feature command
# Verifies that spec-writer and planner agents are invoked correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-helpers.sh"

echo "Test: /sdd-new-feature invokes correct agents"
echo ""

# Setup - create a minimal SDD project structure first
TEST_PROJECT=$(setup_test_project "sdd-new-feature")

echo "Test project directory: $TEST_PROJECT"
echo ""

# Create minimal project structure that /sdd-new-feature expects
mkdir -p "$TEST_PROJECT/specs/features"
mkdir -p "$TEST_PROJECT/specs/domain"
mkdir -p "$TEST_PROJECT/components/contract"

# Create minimal glossary
cat > "$TEST_PROJECT/specs/domain/glossary.md" << 'EOF'
# Glossary

## Domains

### Core
The primary business domain.

## Terms

(No terms defined yet)
EOF

# Create minimal INDEX.md
cat > "$TEST_PROJECT/specs/INDEX.md" << 'EOF'
# Specifications Index

## Active Specifications

(No specifications yet)
EOF

echo "Created minimal project structure"
echo ""

# Run the new-feature command
PROMPT=$(cat "$SCRIPT_DIR/../prompts/sdd-new-feature.txt")

echo "Running /sdd-new-feature..."
OUTPUT=$(run_claude_capture "$PROMPT" 300 "$TEST_PROJECT")

# Save output for debugging
echo "$OUTPUT" > "$TEST_PROJECT/claude-output.json"

echo ""
echo "Verifying agent invocations..."
echo ""

# Verify agents were used
assert_agent_used "$OUTPUT" "spec-writer" "spec-writer agent was invoked"
assert_agent_used "$OUTPUT" "planner" "planner agent was invoked"

# Verify agent order (spec-writer should come before planner)
assert_agent_order "$OUTPUT" "spec-writer" "planner" "spec-writer invoked before planner"

echo ""
echo "Verifying generated files..."
echo ""

# Find the generated spec directory (it will be in specs/features/YYYY/MM/DD/user-auth/)
SPEC_DIR=$(find "$TEST_PROJECT/specs/features" -type d -name "user-auth" 2>/dev/null | head -1)

if [[ -n "$SPEC_DIR" && -d "$SPEC_DIR" ]]; then
    echo "Found spec directory: $SPEC_DIR"

    # Verify SPEC.md exists and has correct content
    assert_file_exists "$(dirname "$SPEC_DIR")" "user-auth/SPEC.md" "SPEC.md created"
    assert_file_contains "$SPEC_DIR" "SPEC.md" "sdd_version:" "SPEC.md contains sdd_version"
    assert_file_contains "$SPEC_DIR" "SPEC.md" "issue:" "SPEC.md contains issue reference"

    # Verify PLAN.md exists and has correct content
    assert_file_exists "$(dirname "$SPEC_DIR")" "user-auth/PLAN.md" "PLAN.md created"
    assert_file_contains "$SPEC_DIR" "PLAN.md" "sdd_version:" "PLAN.md contains sdd_version"
else
    echo -e "${RED}[FAIL]${NC} Spec directory for 'user-auth' not found"
    ((TESTS_FAILED++))
fi

echo ""
echo "Cleanup..."
# cleanup_test_project "$TEST_PROJECT"

print_summary
