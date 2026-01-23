"""
Test: /sdd-init command
Verifies that sdd-init creates the expected project structure.
"""

import pytest

from conftest import TestProject, run_claude


@pytest.fixture
def test_project(tmp_path):
    """Create a test project for sdd-init."""
    from conftest import TEST_OUTPUT_DIR
    import time

    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    project_dir = TEST_OUTPUT_DIR / f"sdd-init-fullstack-{int(time.time())}"
    project_dir.mkdir(parents=True)

    return TestProject(path=project_dir, name="sdd-init-fullstack")


def test_sdd_init_creates_fullstack_structure(test_project: TestProject, prompts_dir):
    """Test that /sdd-init creates the expected Full-Stack project structure."""
    prompt = (prompts_dir / "sdd-init-fullstack.txt").read_text()

    print(f"\nTest directory: {test_project.path}\n")
    print("Running /sdd-init...")

    result = run_claude(prompt, test_project.path, timeout_seconds=300)

    # Save output for debugging
    (test_project.path / "claude-output.json").write_text(result.output)

    print("\nVerifying project structure...\n")

    # sdd-init creates a subdirectory with the project name
    project_subdir = test_project.path / "test-fullstack-project"
    if project_subdir.is_dir():
        print(f"Project created in subdirectory: {project_subdir}")
        project = TestProject(path=project_subdir, name="test-fullstack-project")
    else:
        print(f"Using test directory directly: {test_project.path}")
        project = test_project

    # Verify directory structure
    assert project.is_dir("specs"), "specs/ directory created"
    assert project.is_dir("specs", "domain"), "specs/domain/ directory created"
    assert project.is_dir("specs", "changes"), "specs/changes/ directory created"
    assert project.is_dir("components"), "components/ directory created"
    assert project.is_dir("components", "config"), "components/config/ directory created"
    assert project.is_dir("components", "config", "schemas"), "components/config/schemas/ directory created"
    assert project.is_dir("components", "contract"), "components/contract/ directory created"
    assert project.is_dir("components", "server"), "components/server/ directory created"
    assert project.is_dir("components", "server", "src", "app"), "components/server/src/app/ directory created"
    assert project.is_dir("components", "webapp"), "components/webapp/ directory created"

    # Verify key files exist
    assert project.is_file("README.md"), "README.md created"
    assert project.is_file("CLAUDE.md"), "CLAUDE.md created"
    assert project.is_file("package.json"), "Root package.json created"
    assert project.is_file("specs", "INDEX.md"), "specs/INDEX.md created"
    assert project.is_file("specs", "domain", "glossary.md"), "Glossary created"

    # Verify config component
    assert project.is_file("components", "config", "config.yaml"), "Base config.yaml created"
    assert project.is_file("components", "config", "schemas", "schema.json"), "Config schema created"

    # Verify server component
    assert project.is_file("components", "server", "package.json"), "Server package.json created"
    assert project.is_file("components", "server", "src", "app", "create_app.ts"), "Server create_app.ts created"
    assert project.is_file("components", "server", "src", "index.ts"), "Server entry point created"

    # Verify webapp component
    assert project.is_file("components", "webapp", "package.json"), "Webapp package.json created"
    assert project.is_file("components", "webapp", "index.html"), "Webapp index.html created"
    assert project.is_file("components", "webapp", "vite.config.ts"), "Webapp vite.config.ts created"

    # Verify contract component
    assert project.is_file("components", "contract", "openapi.yaml"), "OpenAPI spec created"

    # Verify project name substitution
    assert project.file_contains("package.json", "test-fullstack-project"), "Project name in root package.json"

    print("\nAll assertions passed!")
