---
name: project-scaffolding
description: Scaffolds project-level structure (root files, specs, config).
---

# Project Scaffolding Skill

Creates the non-component parts of an SDD project: root files, specs directory, and config directory.

## When to Use

This skill is called by the main `scaffolding` skill during project initialization. It creates the foundational project structure that all components depend on.

## What It Creates

### Root Files

| File | Purpose |
|------|---------|
| `README.md` | Project documentation |
| `CLAUDE.md` | Claude Code guidance |
| `package.json` | Root workspace configuration |
| `.gitignore` | Git ignore patterns |

### Specs Directory

```
specs/
├── INDEX.md              # Specifications index
├── SNAPSHOT.md           # Current state snapshot
├── domain/
│   ├── glossary.md       # Domain terms
│   ├── definitions/      # Domain definitions
│   └── use-cases/        # Business use cases
├── architecture/
│   └── overview.md       # Architecture overview (generated)
├── changes/              # Change specifications
└── external/             # External specs (if imported)
```

### Config Directory

```
config/
├── config.yaml           # Base configuration
├── config-local.yaml     # Local development overrides
├── config-testing.yaml   # Test environment overrides
├── config-production.yaml # Production overrides
└── schemas/
    ├── schema.json       # Combined schema
    ├── app-schema.json   # Application schema
    └── ops-schema.json   # Operations schema
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name (lowercase, hyphens) |
| `{{PROJECT_DESCRIPTION}}` | Brief project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |

## Usage

Called programmatically by the scaffolding script:

```python
from project_scaffolding import scaffold_project

scaffold_project(
    target_dir="/path/to/project",
    project_name="my-app",
    project_description="My application",
    primary_domain="Task Management",
)
```

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```
skills/project-scaffolding/templates/
├── project/
│   ├── README.md
│   ├── CLAUDE.md
│   └── package.json
├── specs/
│   ├── INDEX.md
│   ├── SNAPSHOT.md
│   └── glossary.md
└── config/
    ├── config.yaml
    ├── config-*.yaml
    └── schemas/
        └── *.json
```
