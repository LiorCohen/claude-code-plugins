"""
SDD Plugin Test Framework
Common fixtures and utilities for running and validating SDD plugin tests.
"""

import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Generator

import pytest
import requests

# Directories
TESTS_DIR = Path(__file__).parent  # tests/sdd/
MARKETPLACE_DIR = TESTS_DIR.parent.parent  # repository root
PLUGIN_DIR = MARKETPLACE_DIR / "full-stack-spec-driven-dev"
TEST_OUTPUT_DIR = Path(os.environ.get("TEST_OUTPUT_DIR", "/tmp/sdd-tests"))


@dataclass
class ClaudeResult:
    """Result from running Claude CLI."""

    output: str
    exit_code: int
    elapsed_seconds: int

    def contains(self, pattern: str) -> bool:
        """Check if output contains a pattern."""
        return pattern in self.output

    def matches(self, pattern: str) -> bool:
        """Check if output matches a regex pattern."""
        return bool(re.search(pattern, self.output))

    def agent_was_used(self, agent_name: str) -> bool:
        """Check if a specific agent was invoked via Task tool."""
        pattern = rf'"subagent_type"\s*:\s*"{agent_name}"'
        return bool(re.search(pattern, self.output))

    def agent_order(self, first: str, second: str) -> bool:
        """Check if agents were used in a specific order."""
        first_match = re.search(rf'"subagent_type"\s*:\s*"{first}"', self.output)
        second_match = re.search(rf'"subagent_type"\s*:\s*"{second}"', self.output)

        if not first_match or not second_match:
            return False

        return first_match.start() < second_match.start()


@dataclass
class TestProject:
    """A test project directory."""

    path: Path
    name: str

    def exists(self, *parts: str) -> bool:
        """Check if a path exists within the project."""
        return (self.path / Path(*parts)).exists()

    def is_dir(self, *parts: str) -> bool:
        """Check if a directory exists within the project."""
        return (self.path / Path(*parts)).is_dir()

    def is_file(self, *parts: str) -> bool:
        """Check if a file exists within the project."""
        return (self.path / Path(*parts)).is_file()

    def file_contains(self, file_path: str, pattern: str) -> bool:
        """Check if a file contains a pattern."""
        full_path = self.path / file_path
        if not full_path.is_file():
            return False
        content = full_path.read_text()
        return pattern in content

    def read_file(self, file_path: str) -> str:
        """Read a file from the project."""
        return (self.path / file_path).read_text()

    def find_dir(self, name: str) -> Path | None:
        """Find a directory by name within the project."""
        for path in self.path.rglob(name):
            if path.is_dir():
                return path
        return None

    def cleanup(self) -> None:
        """Remove the test project directory."""
        if self.path.exists() and str(self.path).startswith(str(TEST_OUTPUT_DIR)):
            shutil.rmtree(self.path)


def run_claude(
    prompt: str,
    working_dir: Path,
    timeout_seconds: int = 120,
    verbose: bool = True,
) -> ClaudeResult:
    """
    Run Claude CLI with the SDD plugin loaded.

    Args:
        prompt: The prompt to send to Claude
        working_dir: Directory to run Claude in
        timeout_seconds: Maximum time to wait
        verbose: Whether to print progress

    Returns:
        ClaudeResult with output, exit code, and elapsed time
    """
    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_file = TEST_OUTPUT_DIR / f"output-{int(time.time())}.json"

    cmd = [
        "claude",
        "-p",
        prompt,
        "--add-dir",
        str(MARKETPLACE_DIR),
        "--permission-mode",
        "bypassPermissions",
        "--output-format",
        "stream-json",
    ]

    if verbose:
        print(f"\033[1;33mRunning Claude with timeout {timeout_seconds}s in {working_dir}...\033[0m")

    start_time = time.time()
    tool_count = 0
    last_tool = ""

    # Start process
    process = subprocess.Popen(
        cmd,
        cwd=working_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    output_lines = []

    try:
        while True:
            # Check if process is done
            return_code = process.poll()
            if return_code is not None:
                # Process finished, read remaining output
                remaining = process.stdout.read()
                if remaining:
                    output_lines.append(remaining)
                break

            # Check timeout
            elapsed = int(time.time() - start_time)
            if elapsed > timeout_seconds:
                process.kill()
                raise TimeoutError(f"Claude timed out after {timeout_seconds}s")

            # Read available output
            line = process.stdout.readline()
            if line:
                output_lines.append(line)

                # Check for tool calls
                tool_match = re.search(r'"name":"([^"]+)"', line)
                if tool_match and tool_match.group(1) != last_tool:
                    tool_count += 1
                    last_tool = tool_match.group(1)
                    if verbose:
                        print(f"  \033[1;33m[{elapsed}s]\033[0m Tool #{tool_count}: {last_tool}")

                # Check for agent invocations
                agent_match = re.search(r'"subagent_type":"([^"]+)"', line)
                if agent_match and verbose:
                    print(f"  \033[0;32m[{elapsed}s]\033[0m Agent invoked: {agent_match.group(1)}")

            # Brief sleep to avoid busy loop
            time.sleep(0.1)

    except Exception as e:
        process.kill()
        raise e

    elapsed = int(time.time() - start_time)
    output = "".join(output_lines)

    # Save output for debugging
    output_file.write_text(output)

    if verbose:
        if process.returncode == 0:
            print(f"\033[0;32mClaude completed in {elapsed}s\033[0m")
        else:
            print(f"\033[0;31mClaude exited with code {process.returncode} after {elapsed}s\033[0m")

    return ClaudeResult(
        output=output,
        exit_code=process.returncode or 0,
        elapsed_seconds=elapsed,
    )


@pytest.fixture
def test_project(request) -> Generator[TestProject, None, None]:
    """Create a temporary test project directory."""
    name = getattr(request, "param", "test-project")
    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    project_dir = TEST_OUTPUT_DIR / f"{name}-{int(time.time())}"
    project_dir.mkdir(parents=True)

    project = TestProject(path=project_dir, name=name)
    yield project

    # Cleanup after test (comment out for debugging)
    # project.cleanup()


@pytest.fixture
def prompts_dir() -> Path:
    """Return the prompts directory."""
    return TESTS_DIR / "prompts"


def http_get(url: str, timeout: int = 5) -> tuple[int, dict | str]:
    """
    Make an HTTP GET request.

    Returns:
        Tuple of (status_code, response_body)
    """
    try:
        response = requests.get(url, timeout=timeout)
        try:
            body = response.json()
        except json.JSONDecodeError:
            body = response.text
        return response.status_code, body
    except requests.RequestException:
        return 0, ""


def wait_for_server(url: str, timeout: int = 30, interval: float = 0.5) -> bool:
    """
    Wait for a server to respond at the given URL.

    Returns:
        True if server responded within timeout, False otherwise
    """
    start = time.time()
    while time.time() - start < timeout:
        try:
            response = requests.get(url, timeout=1)
            if response.status_code < 500:
                return True
        except requests.RequestException:
            pass
        time.sleep(interval)
    return False


def run_npm(command: str, cwd: Path, timeout: int = 300) -> subprocess.CompletedProcess:
    """Run an npm command in the given directory."""
    return subprocess.run(
        ["npm"] + command.split(),
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
