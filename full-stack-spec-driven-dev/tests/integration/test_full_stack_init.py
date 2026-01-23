"""
Integration Test: Full-Stack Project Init
Creates a project with /sdd-init and verifies it builds and runs.
"""

import signal
import subprocess
import time

import pytest

from conftest import TestProject, http_get, run_claude, run_npm, wait_for_server


@pytest.fixture
def test_project():
    """Create a test project for integration testing."""
    from conftest import TEST_OUTPUT_DIR

    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    project_dir = TEST_OUTPUT_DIR / f"integration-fullstack-{int(time.time())}"
    project_dir.mkdir(parents=True)

    return TestProject(path=project_dir, name="integration-fullstack")


class TestFullStackIntegration:
    """Integration tests for full-stack project initialization."""

    @pytest.mark.slow
    def test_full_stack_project_builds_and_runs(self, test_project: TestProject, prompts_dir):
        """
        Test that a full-stack project created by /sdd-init builds and runs correctly.

        This test takes 10-30 minutes and requires npm.
        """
        print("\nIntegration Test: Full-Stack project builds and runs")
        print("\nWARNING: This test takes 10-30 minutes and requires npm\n")
        print(f"Test project directory: {test_project.path}\n")

        # Step 1: Run /sdd-init
        print("Step 1: Running /sdd-init...")
        print("=" * 42)

        prompt = (prompts_dir / "sdd-init-fullstack.txt").read_text()
        result = run_claude(prompt, test_project.path, timeout_seconds=600)

        (test_project.path / "claude-output.json").write_text(result.output)

        # Check if project was created in a subdirectory
        project_subdir = test_project.path / "test-fullstack-project"
        if project_subdir.is_dir():
            print("Project created in subdirectory, updating project path...")
            project = TestProject(path=project_subdir, name="test-fullstack-project")
        else:
            project = test_project

        # Verify basic structure
        assert project.is_dir("components", "server"), "Server component created"
        assert project.is_dir("components", "webapp"), "Webapp component created"
        assert project.is_file("package.json"), "Root package.json exists"

        # Step 2: Install dependencies
        print("\nStep 2: Installing dependencies...")
        print("=" * 42)

        install_result = run_npm("install --workspaces", project.path)
        (project.path / "npm-install.log").write_text(
            install_result.stdout + "\n" + install_result.stderr
        )

        if install_result.returncode != 0:
            print(f"npm install stderr: {install_result.stderr}")
        assert install_result.returncode == 0, "npm install succeeded"
        print("npm install succeeded")

        # Step 3: Build server
        print("\nStep 3: Building server...")
        print("=" * 42)

        server_dir = project.path / "components" / "server"
        build_result = run_npm("run build", server_dir)
        (project.path / "server-build.log").write_text(
            build_result.stdout + "\n" + build_result.stderr
        )

        if build_result.returncode != 0:
            print(f"Server build stderr: {build_result.stderr}")
        assert build_result.returncode == 0, "Server build succeeded"
        print("Server build succeeded")

        # Step 4: Build webapp
        print("\nStep 4: Building webapp...")
        print("=" * 42)

        webapp_dir = project.path / "components" / "webapp"
        build_result = run_npm("run build", webapp_dir)
        (project.path / "webapp-build.log").write_text(
            build_result.stdout + "\n" + build_result.stderr
        )

        if build_result.returncode != 0:
            print(f"Webapp build stderr: {build_result.stderr}")
        assert build_result.returncode == 0, "Webapp build succeeded"
        print("Webapp build succeeded")

        # Step 5: Start server and test health endpoint
        print("\nStep 5: Starting server and testing health endpoint...")
        print("=" * 42)

        server_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=server_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            preexec_fn=lambda: signal.signal(signal.SIGINT, signal.SIG_IGN),
        )

        try:
            print(f"Waiting for server to start (PID: {server_process.pid})...")

            # Wait for health endpoint (lifecycle probes run on port 9090)
            health_url = "http://localhost:9090/health"
            server_ready = wait_for_server(health_url, timeout=30)

            if server_ready:
                status_code, body = http_get(health_url)
                assert status_code == 200, f"Health endpoint returned {status_code}"
                assert isinstance(body, dict) and body.get("status") == "ok", \
                    f"Health endpoint returned unexpected body: {body}"
                print("Server /health endpoint responds correctly")
            else:
                # Capture server output for debugging
                server_process.terminate()
                server_process.wait(timeout=5)
                output = server_process.stdout.read() if server_process.stdout else ""
                (project.path / "server.log").write_text(output)
                pytest.fail(f"Server /health endpoint did not respond. Server output:\n{output[:2000]}")

        finally:
            print("Stopping server...")
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server_process.kill()

        # Step 6: Type checking
        print("\nStep 6: Type checking...")
        print("=" * 42)

        typecheck_result = run_npm("run typecheck", server_dir)
        (project.path / "server-typecheck.log").write_text(
            typecheck_result.stdout + "\n" + typecheck_result.stderr
        )
        if typecheck_result.returncode != 0:
            print(f"Server typecheck stderr: {typecheck_result.stderr}")
        assert typecheck_result.returncode == 0, "Server typecheck passed"
        print("Server typecheck passed")

        typecheck_result = run_npm("run typecheck", webapp_dir)
        (project.path / "webapp-typecheck.log").write_text(
            typecheck_result.stdout + "\n" + typecheck_result.stderr
        )
        if typecheck_result.returncode != 0:
            print(f"Webapp typecheck stderr: {typecheck_result.stderr}")
        assert typecheck_result.returncode == 0, "Webapp typecheck passed"
        print("Webapp typecheck passed")

        print(f"\nTest artifacts saved in: {project.path}")
        print("\nAll assertions passed!")
