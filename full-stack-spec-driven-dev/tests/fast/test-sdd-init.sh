#!/bin/bash
# Test: /sdd-init command
# Verifies that sdd-init creates the expected project structure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-helpers.sh"

echo "Test: /sdd-init creates Full-Stack project structure"
echo ""

# Setup
TEST_DIR=$(setup_test_project "sdd-init-fullstack")
PROMPT=$(cat "$SCRIPT_DIR/../prompts/sdd-init-fullstack.txt")

echo "Test directory: $TEST_DIR"
echo ""

# Run Claude with the init command
echo "Running /sdd-init..."
OUTPUT=$(run_claude_capture "$PROMPT" 300 "$TEST_DIR")

# Save output for debugging
echo "$OUTPUT" > "$TEST_DIR/claude-output.json"

echo ""
echo "Verifying project structure..."
echo ""

# sdd-init creates a subdirectory with the project name
PROJECT_DIR="$TEST_DIR/test-fullstack-project"

# Check if project directory was created
if [[ ! -d "$PROJECT_DIR" ]]; then
    echo "Project subdirectory not found at $PROJECT_DIR"
    echo "Contents of test directory:"
    ls -la "$TEST_DIR"
    # Fall back to checking the test directory itself
    PROJECT_DIR="$TEST_DIR"
fi

echo "Checking project at: $PROJECT_DIR"
echo ""

# Verify directory structure
assert_dir_exists "$PROJECT_DIR" "specs" "specs/ directory created"
assert_dir_exists "$PROJECT_DIR" "specs/domain" "specs/domain/ directory created"
assert_dir_exists "$PROJECT_DIR" "specs/features" "specs/features/ directory created"
assert_dir_exists "$PROJECT_DIR" "components" "components/ directory created"
assert_dir_exists "$PROJECT_DIR" "components/config" "components/config/ directory created (always required)"
assert_dir_exists "$PROJECT_DIR" "components/config/schemas" "components/config/schemas/ directory created"
assert_dir_exists "$PROJECT_DIR" "components/contract" "components/contract/ directory created"
assert_dir_exists "$PROJECT_DIR" "components/server" "components/server/ directory created"
assert_dir_exists "$PROJECT_DIR" "components/server/src/app" "components/server/src/app/ directory created"
assert_dir_exists "$PROJECT_DIR" "components/webapp" "components/webapp/ directory created"

# Verify key files exist
assert_file_exists "$PROJECT_DIR" "README.md" "README.md created"
assert_file_exists "$PROJECT_DIR" "CLAUDE.md" "CLAUDE.md created"
assert_file_exists "$PROJECT_DIR" "package.json" "Root package.json created"
assert_file_exists "$PROJECT_DIR" "specs/INDEX.md" "specs/INDEX.md created"
assert_file_exists "$PROJECT_DIR" "specs/domain/glossary.md" "Glossary created"

# Verify config component (always required)
assert_file_exists "$PROJECT_DIR" "components/config/config.yaml" "Base config.yaml created"
assert_file_exists "$PROJECT_DIR" "components/config/schemas/schema.json" "Config schema created"

# Verify server component
assert_file_exists "$PROJECT_DIR" "components/server/package.json" "Server package.json created"
assert_file_exists "$PROJECT_DIR" "components/server/src/app/create_app.ts" "Server create_app.ts created"
assert_file_exists "$PROJECT_DIR" "components/server/src/index.ts" "Server entry point created"

# Verify webapp component
assert_file_exists "$PROJECT_DIR" "components/webapp/package.json" "Webapp package.json created"
assert_file_exists "$PROJECT_DIR" "components/webapp/index.html" "Webapp index.html created"
assert_file_exists "$PROJECT_DIR" "components/webapp/vite.config.ts" "Webapp vite.config.ts created"

# Verify contract component
assert_file_exists "$PROJECT_DIR" "components/contract/openapi.yaml" "OpenAPI spec created"

# Verify project name substitution in files
assert_file_contains "$PROJECT_DIR" "package.json" "test-fullstack-project" "Project name in root package.json"

echo ""
echo "Cleanup..."
# Optionally cleanup (comment out to keep for debugging)
# cleanup_test_project "$TEST_DIR"

print_summary
