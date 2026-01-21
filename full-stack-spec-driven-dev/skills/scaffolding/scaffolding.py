#!/usr/bin/env python3
"""
SDD Project Scaffolding Script

Creates project structure from templates with variable substitution.
Called by Claude after user approves project configuration.

Usage:
    python scaffolding.py --config config.json

Config JSON format:
{
    "project_name": "my-app",
    "project_description": "My application",
    "primary_domain": "E-commerce",
    "target_dir": "/path/to/output",
    "components": ["contract", "server", "webapp", "config"],
    "template_dir": "/path/to/templates"
}
"""

import argparse
import json
import os
import shutil
import sys
from pathlib import Path
from typing import TypedDict


class Config(TypedDict):
    project_name: str
    project_description: str
    primary_domain: str
    target_dir: str
    components: list[str]
    template_dir: str


def substitute_variables(content: str, config: Config) -> str:
    """Replace template variables with config values."""
    replacements = {
        "{{PROJECT_NAME}}": config["project_name"],
        "{{PROJECT_DESCRIPTION}}": config["project_description"],
        "{{PRIMARY_DOMAIN}}": config["primary_domain"],
    }
    for var, value in replacements.items():
        content = content.replace(var, value)
    return content


def copy_template_file(
    src: Path, dest: Path, config: Config, substitute: bool = True
) -> None:
    """Copy a template file, optionally substituting variables."""
    dest.parent.mkdir(parents=True, exist_ok=True)

    if substitute and src.suffix in [".md", ".json", ".yaml", ".yml", ".ts", ".tsx", ".html", ".css", ".js"]:
        content = src.read_text()
        content = substitute_variables(content, config)
        dest.write_text(content)
    else:
        shutil.copy2(src, dest)

    print(f"  Created: {dest.relative_to(config['target_dir'])}")


def create_directory(path: Path, config: Config) -> None:
    """Create a directory if it doesn't exist."""
    path.mkdir(parents=True, exist_ok=True)
    print(f"  Created: {path.relative_to(config['target_dir'])}/")


def scaffold_project(config: Config) -> dict:
    """Create the complete project structure."""
    target = Path(config["target_dir"])
    templates = Path(config["template_dir"])
    components = set(config["components"])

    created_files = []
    created_dirs = []

    # Create target directory
    target.mkdir(parents=True, exist_ok=True)

    print(f"\nScaffolding project: {config['project_name']}")
    print(f"Target: {target}")
    print(f"Components: {', '.join(components)}")
    print()

    # -------------------------------------------------------------------------
    # Step 1: Create root .gitignore
    # -------------------------------------------------------------------------
    print("Creating root files...")
    gitignore = target / ".gitignore"
    gitignore.write_text("""node_modules/
.env
.DS_Store
dist/
*.log
""")
    created_files.append(".gitignore")
    print(f"  Created: .gitignore")

    # -------------------------------------------------------------------------
    # Step 2: Create directory structure
    # -------------------------------------------------------------------------
    print("\nCreating directory structure...")

    # Always create specs directories
    specs_dirs = [
        "specs",
        "specs/domain",
        "specs/domain/definitions",
        "specs/domain/use-cases",
        "specs/architecture",
        "specs/changes",
        "specs/external",
    ]
    for d in specs_dirs:
        create_directory(target / d, config)
        created_dirs.append(d)

    # Config is always created
    config_dirs = [
        "components/config",
        "components/config/schemas",
    ]
    for d in config_dirs:
        create_directory(target / d, config)
        created_dirs.append(d)

    # Component-specific directories
    if "contract" in components:
        create_directory(target / "components/contract", config)
        created_dirs.append("components/contract")

    if "server" in components:
        server_dirs = [
            "components/server/src/app",
            "components/server/src/config",
            "components/server/src/controller/http_handlers",
            "components/server/src/model/definitions",
            "components/server/src/model/use-cases",
            "components/server/src/dal",
            "components/server/src/telemetry",
        ]
        for d in server_dirs:
            create_directory(target / d, config)
            created_dirs.append(d)

    if "webapp" in components:
        webapp_dirs = [
            "components/webapp/src/pages",
            "components/webapp/src/components",
            "components/webapp/src/viewmodels",
            "components/webapp/src/models",
            "components/webapp/src/services",
            "components/webapp/src/stores",
            "components/webapp/src/types",
            "components/webapp/src/utils",
        ]
        for d in webapp_dirs:
            create_directory(target / d, config)
            created_dirs.append(d)

    if "helm" in components:
        create_directory(target / "components/helm", config)
        created_dirs.append("components/helm")

    if "testing" in components:
        testing_dirs = [
            "components/testing/tests/integration",
            "components/testing/tests/component",
            "components/testing/tests/e2e",
            "components/testing/testsuites",
        ]
        for d in testing_dirs:
            create_directory(target / d, config)
            created_dirs.append(d)

    if "cicd" in components:
        create_directory(target / ".github/workflows", config)
        created_dirs.append(".github/workflows")

    # -------------------------------------------------------------------------
    # Step 3: Copy and customize template files
    # -------------------------------------------------------------------------
    print("\nCopying template files...")

    # Root project files
    project_templates = templates / "project"
    if project_templates.exists():
        for template_file in ["README.md", "CLAUDE.md", "package.json"]:
            src = project_templates / template_file
            if src.exists():
                copy_template_file(src, target / template_file, config)
                created_files.append(template_file)

    # Spec files
    specs_templates = templates / "specs"
    if specs_templates.exists():
        spec_files = [
            ("INDEX.md", "specs/INDEX.md"),
            ("SNAPSHOT.md", "specs/SNAPSHOT.md"),
            ("glossary.md", "specs/domain/glossary.md"),
        ]
        for src_name, dest_path in spec_files:
            src = specs_templates / src_name
            if src.exists():
                copy_template_file(src, target / dest_path, config)
                created_files.append(dest_path)

    # Architecture overview (generate, not from template)
    arch_overview = target / "specs/architecture/overview.md"
    arch_content = f"""# Architecture Overview

This document describes the architecture of {config['project_name']}.

## Components

"""
    component_descriptions = {
        "contract": "- **Contract** (`components/contract/`): OpenAPI specifications and type generation",
        "server": "- **Server** (`components/server/`): Node.js/TypeScript backend with 5-layer architecture",
        "webapp": "- **Webapp** (`components/webapp/`): React/TypeScript frontend with MVVM pattern",
        "config": "- **Config** (`components/config/`): YAML-based configuration management",
        "helm": "- **Helm** (`components/helm/`): Kubernetes deployment charts",
        "testing": "- **Testing** (`components/testing/`): Testkube test definitions",
    }
    for comp in sorted(components):
        if comp in component_descriptions:
            arch_content += component_descriptions[comp] + "\n"

    arch_overview.write_text(arch_content)
    created_files.append("specs/architecture/overview.md")
    print(f"  Created: specs/architecture/overview.md")

    # Config component (always created)
    config_templates = templates / "components/config"
    if config_templates.exists():
        config_files = [
            "config.yaml",
            "config-local.yaml",
            "config-testing.yaml",
            "config-production.yaml",
            "schemas/schema.json",
            "schemas/ops-schema.json",
            "schemas/app-schema.json",
        ]
        for cf in config_files:
            src = config_templates / cf
            if src.exists():
                copy_template_file(src, target / "components/config" / cf, config)
                created_files.append(f"components/config/{cf}")

    # Contract component
    if "contract" in components:
        contract_templates = templates / "components/contract"
        if contract_templates.exists():
            contract_files = ["package.json", "openapi.yaml"]
            for cf in contract_files:
                src = contract_templates / cf
                if src.exists():
                    copy_template_file(src, target / "components/contract" / cf, config)
                    created_files.append(f"components/contract/{cf}")

        # Create contract .gitignore
        contract_gitignore = target / "components/contract/.gitignore"
        contract_gitignore.write_text("node_modules/\ngenerated/\n")
        created_files.append("components/contract/.gitignore")
        print(f"  Created: components/contract/.gitignore")

    # Server component
    if "server" in components:
        server_templates = templates / "components/server"
        if server_templates.exists():
            # Walk through all server template files
            for src_file in server_templates.rglob("*"):
                if src_file.is_file():
                    rel_path = src_file.relative_to(server_templates)
                    dest_file = target / "components/server" / rel_path
                    copy_template_file(src_file, dest_file, config)
                    created_files.append(f"components/server/{rel_path}")

    # Webapp component
    if "webapp" in components:
        webapp_templates = templates / "components/webapp"
        if webapp_templates.exists():
            # Walk through all webapp template files
            for src_file in webapp_templates.rglob("*"):
                if src_file.is_file():
                    rel_path = src_file.relative_to(webapp_templates)
                    dest_file = target / "components/webapp" / rel_path
                    copy_template_file(src_file, dest_file, config)
                    created_files.append(f"components/webapp/{rel_path}")

    # CI/CD workflows
    if "cicd" in components:
        ci_workflow = target / ".github/workflows/ci.yaml"
        ci_content = f"""name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install --workspaces

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build
"""
        ci_workflow.write_text(ci_content)
        created_files.append(".github/workflows/ci.yaml")
        print(f"  Created: .github/workflows/ci.yaml")

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------
    print(f"\n{'='*60}")
    print(f"Scaffolding complete!")
    print(f"{'='*60}")
    print(f"Created {len(created_dirs)} directories")
    print(f"Created {len(created_files)} files")
    print(f"Location: {target}")

    return {
        "success": True,
        "target_dir": str(target),
        "created_dirs": len(created_dirs),
        "created_files": len(created_files),
        "files": created_files,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="SDD Project Scaffolding")
    parser.add_argument(
        "--config",
        required=True,
        help="Path to JSON config file",
    )
    parser.add_argument(
        "--json-output",
        action="store_true",
        help="Output result as JSON",
    )

    args = parser.parse_args()

    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}", file=sys.stderr)
        return 1

    with open(config_path) as f:
        config: Config = json.load(f)

    # Validate required fields
    required = ["project_name", "target_dir", "components", "template_dir"]
    for field in required:
        if field not in config:
            print(f"Error: Missing required config field: {field}", file=sys.stderr)
            return 1

    # Set defaults
    config.setdefault("project_description", f"A {config['project_name']} project")
    config.setdefault("primary_domain", "General")

    # Run scaffolding
    try:
        result = scaffold_project(config)

        if args.json_output:
            print(json.dumps(result, indent=2))

        return 0 if result["success"] else 1

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if args.json_output:
            print(json.dumps({"success": False, "error": str(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
