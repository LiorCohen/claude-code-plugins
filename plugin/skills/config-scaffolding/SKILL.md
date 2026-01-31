---
name: config-scaffolding
description: Scaffolds the config component for centralized configuration management.
---

# Config Scaffolding Skill

Scaffolds the mandatory config component for centralized configuration management.

## When to Use

This skill is called by the main `scaffolding` skill during project initialization. The config component is **mandatory** - every SDD project has exactly one.

## What It Creates

```
components/config/
├── package.json                # Minimal package for workspace imports
├── tsconfig.json               # TypeScript config for type exports
├── envs/
│   ├── default/
│   │   └── config.yaml         # Base config (empty sections)
│   └── local/
│       └── config.yaml         # Local overrides (empty)
├── schemas/
│   └── config.schema.json      # Main schema (minimal)
└── types/
    └── index.ts                # Re-exports config types
```

## Config Component Purpose

The config component is a minimal TypeScript project with no runtime code. It exists so:

1. **Other components can import types** via workspace package `@{project}/config/types`
2. **YAML files are the source of truth** for configuration values
3. **`sdd-system` CLI** (via `/sdd-config`) generates merged configs for each environment

## Environment Structure

Each environment has its own directory under `envs/`:

| Directory | Purpose |
|-----------|---------|
| `envs/default/` | Base configuration - all environments inherit from this |
| `envs/local/` | Local development overrides (always present) |
| `envs/{env}/` | Other environments added as needed (staging, production, etc.) |

**Merge order:** `envs/default/` → `envs/{env}/`

## Config Structure

```yaml
# envs/default/config.yaml

global: {}  # Reserved for future cross-cutting concerns

# Each component gets a section matching its directory name
# Users add properties as needed
server-task-service: {}
webapp-task-dashboard: {}
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name (lowercase, hyphens) |

## Usage

Called programmatically by the scaffolding skill during project initialization:

```python
from config_scaffolding import scaffold_config

scaffold_config(
    target_dir="/path/to/project",
    project_name="my-app",
)
```

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```
skills/config-scaffolding/templates/
├── package.json
├── tsconfig.json
├── envs/
│   ├── default/
│   │   └── config.yaml
│   └── local/
│       └── config.yaml
├── schemas/
│   └── config.schema.json
└── types/
    └── index.ts
```

## Related Skills

- `config-standards` - Standards and patterns for configuration
- `backend-scaffolding` - Backend components that consume config
- `helm-scaffolding` - Helm charts that inject config at deploy time
