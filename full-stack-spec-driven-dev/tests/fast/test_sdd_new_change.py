"""
Test: /sdd-new-change command
Verifies that spec-writer and planner agents are invoked correctly.
"""

import pytest

from conftest import TestProject, run_claude


@pytest.fixture
def test_project():
    """Create a test project with minimal SDD structure for sdd-new-change."""
    from conftest import TEST_OUTPUT_DIR
    import time

    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    project_dir = TEST_OUTPUT_DIR / f"sdd-new-change-{int(time.time())}"
    project_dir.mkdir(parents=True)

    project = TestProject(path=project_dir, name="sdd-new-change")

    # Create minimal project structure that /sdd-new-change expects
    (project_dir / "specs" / "changes").mkdir(parents=True)
    (project_dir / "specs" / "domain").mkdir(parents=True)
    (project_dir / "components" / "contract").mkdir(parents=True)

    # Create minimal glossary
    (project_dir / "specs" / "domain" / "glossary.md").write_text("""# Glossary

## Domains

### Core
The primary business domain.

## Terms

(No terms defined yet)
""")

    # Create minimal INDEX.md
    (project_dir / "specs" / "INDEX.md").write_text("""# Specifications Index

## Active Changes

(No changes yet)
""")

    return project


def test_sdd_new_change_invokes_agents(test_project: TestProject, prompts_dir):
    """Test that /sdd-new-change invokes spec-writer and planner agents."""
    prompt = (prompts_dir / "sdd-new-change.txt").read_text()

    print(f"\nTest project directory: {test_project.path}\n")
    print("Created minimal project structure\n")
    print("Running /sdd-new-change...")

    result = run_claude(prompt, test_project.path, timeout_seconds=300)

    # Save output for debugging
    (test_project.path / "claude-output.json").write_text(result.output)

    print("\nVerifying agent invocations...\n")

    # Verify agents were used
    assert result.agent_was_used("spec-writer"), "spec-writer agent was invoked"
    assert result.agent_was_used("planner"), "planner agent was invoked"

    # Verify agent order (spec-writer should come before planner)
    assert result.agent_order("spec-writer", "planner"), "spec-writer invoked before planner"

    print("\nVerifying generated files...\n")

    # Find the generated spec directory
    spec_dir = test_project.find_dir("user-auth")

    assert spec_dir is not None, "Spec directory for 'user-auth' was created"
    print(f"Found spec directory: {spec_dir}")

    # Verify SPEC.md exists and has correct content
    spec_file = spec_dir / "SPEC.md"
    assert spec_file.is_file(), "SPEC.md created"

    spec_content = spec_file.read_text()
    assert "sdd_version:" in spec_content, "SPEC.md contains sdd_version"
    assert "issue:" in spec_content, "SPEC.md contains issue reference"
    assert "type:" in spec_content, "SPEC.md contains type field"

    # Verify PLAN.md exists and has correct content
    plan_file = spec_dir / "PLAN.md"
    assert plan_file.is_file(), "PLAN.md created"

    plan_content = plan_file.read_text()
    assert "sdd_version:" in plan_content, "PLAN.md contains sdd_version"

    print("\nAll assertions passed!")
