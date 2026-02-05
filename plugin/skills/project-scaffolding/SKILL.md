---
name: project-scaffolding
description: Scaffolds project-level structure (root files, specs).
---

# Project Scaffolding Skill

Creates the non-component parts of an SDD project: root files and specs directory.

## Modes

### Minimal Mode (Default for /sdd-init)

Creates only the essential structure needed to start. Additional structure is created on-demand by `/sdd-change new`.

```yaml
mode: minimal
project_name: my-app
target_dir: /path/to/project
```

**Creates:**

```
project/
├── .sdd/
│   └── sdd-settings.yaml     # Minimal settings (config component only)
├── specs/
│   └── INDEX.md              # Empty spec registry
├── README.md
├── CLAUDE.md
└── .gitignore
```

**NOT created in minimal mode:**
- `changes/` directory
- `specs/domain/` subdirectories
- `specs/architecture/`
- `specs/SNAPSHOT.md`
- Root `package.json` (individual components have their own)

### Full Mode (Legacy)

Creates the complete structure. Used when upgrading or explicitly requested.

```yaml
mode: full
project_name: my-app
project_description: My application
primary_domain: Task Management
target_dir: /path/to/project
```

**Creates:**

```
project/
├── .sdd/
│   └── sdd-settings.yaml
├── specs/
│   ├── INDEX.md
│   ├── SNAPSHOT.md
│   └── domain/
│       ├── glossary.md
│       ├── definitions/
│       └── use-cases/
├── changes/
│   └── INDEX.md
├── README.md
├── CLAUDE.md
├── package.json
└── .gitignore
```

## Non-Destructive Behavior (CRITICAL)

This skill NEVER overwrites existing files:

- Before writing any file, check if it exists
- If exists: skip (log that file was skipped)
- If missing: create

This makes it safe to run multiple times for repair/upgrade scenarios.

## When to Use

This skill is called by:
- `/sdd-init` in minimal mode
- Upgrade/repair workflows in full mode

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name (lowercase, hyphens) |
| `{{PROJECT_DESCRIPTION}}` | Brief project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |
| `{{PLUGIN_VERSION}}` | SDD plugin version |
| `{{CURRENT_DATE}}` | Current date (YYYY-MM-DD) |

## Minimal sdd-settings.yaml Template

```yaml
# ============================================================================
# SDD PROJECT SETTINGS - DO NOT EDIT MANUALLY
# ============================================================================
# This file is generated and maintained by SDD commands.
# To modify settings, use: /sdd-settings
# ============================================================================

sdd:
  plugin_version: "{{PLUGIN_VERSION}}"
  initialized_at: "{{CURRENT_DATE}}"
  last_updated: "{{CURRENT_DATE}}"

project:
  name: "{{PROJECT_NAME}}"
  # description and domain are populated as you build features
  # description: "A task management application"
  # domain: "Task Management"

# Components are added here as they are scaffolded via /sdd-change new
# The first change targeting a component type triggers scaffolding.
#
# Example after scaffolding a server:
#   - name: my-app-server
#     type: server
#     settings:
#       server_type: api
#       databases: []
#       provides_contracts: []

components:
  - name: config
    type: config
    settings: {}
```

## Minimal specs/INDEX.md Template

```markdown
# Specifications Index

This file tracks all specifications in the project.

## Changes

No changes yet. Create your first change with:

```
/sdd-change new --type feature --name <feature-name>
```

## Domain Knowledge

Domain knowledge (glossary, personas, use cases) is populated when you create changes.
```

## Templates Location

Templates are in this skill's `templates/` directory:

```
skills/project-scaffolding/templates/
├── minimal/
│   ├── sdd-settings.yaml
│   ├── INDEX.md
│   ├── README.md
│   ├── CLAUDE.md
│   └── gitignore
└── full/
    ├── README.md
    ├── CLAUDE.md
    ├── package.json
    ├── SNAPSHOT.md
    └── glossary.md
```
