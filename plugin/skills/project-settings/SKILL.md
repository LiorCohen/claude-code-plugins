---
name: project-settings
description: Manage project settings in .sdd/sdd-settings.yaml including component settings that drive scaffolding.
user-invocable: false
---

# Project Settings Skill

> **Authoritative Source:** This skill is the single source of truth for the `.sdd/sdd-settings.yaml` schema, component settings, validation rules, and directory mappings. All other skills, agents, and commands MUST reference this skill rather than duplicating settings knowledge inline.

## Purpose

Manage the `.sdd/sdd-settings.yaml` file that stores project configuration and component settings. Component settings are structural decisions that drive scaffolding, config initialization, and deployment.

## File Location

Settings file: `.sdd/sdd-settings.yaml` (git-tracked)

The `.sdd/` directory contains all SDD metadata. Create this directory if it doesn't exist.

## Migration from Legacy Location

If `sdd-settings.yaml` exists at project root (legacy location):
1. Create `.sdd/` directory
2. Move `sdd-settings.yaml` to `.sdd/sdd-settings.yaml`
3. Delete the root file
4. Commit the change

Quick migration command:
```bash
mkdir -p .sdd && mv sdd-settings.yaml .sdd/ && git add -A && git commit -m "Migrate sdd-settings.yaml to .sdd/"
```

## Schema

```yaml
sdd:
  plugin_version: "5.8.0"      # SDD plugin version that created this project
  initialized_at: "2026-01-27" # Date project was initialized
  last_updated: "2026-01-27"   # Date settings were last modified

project:
  name: "my-app"
  description: "A task management SaaS application"
  domain: "Task Management"
  type: "fullstack"            # fullstack | backend | frontend | custom

components:
  # === CONFIG (mandatory singleton) ===
  - name: config
    type: config
    settings: {}

  # === SERVER ===
  - name: main-server
    type: server
    settings:
      server_type: hybrid        # api | worker | cron | hybrid
      modes: [api, worker]       # For hybrid: 2+ modes required
      databases: [primary-db]    # Database components this server uses
      provides_contracts: [public-api]  # Contracts this server implements
      consumes_contracts: []     # Contracts this server calls
      helm: true                 # Whether this server needs a helm chart

  # === WEBAPP ===
  - name: admin-dashboard
    type: webapp
    settings:
      contracts: [public-api]    # Contracts this webapp uses
      helm: true

  # === HELM ===
  - name: main-server-api
    type: helm
    settings:
      deploys: main-server       # Server/webapp component to deploy
      deploy_type: server        # server | webapp
      deploy_modes: [api]        # For servers: which modes to deploy
      ingress: true              # External HTTP access

  # === DATABASE ===
  - name: primary-db
    type: database
    settings:
      provider: postgresql       # Only postgresql for now
      dedicated: false           # Needs own DB server

  # === CONTRACT ===
  - name: public-api
    type: contract
    settings:
      visibility: internal       # public | internal
```

## Settings vs Config

| Aspect | Settings | Config |
|--------|----------|--------|
| **What** | Structural capabilities | Runtime values |
| **When set** | At component creation, changeable | Per-environment |
| **Examples** | `databases`, `provides_contracts`, `server_type` | `port: 3000`, `replicas: 3` |
| **Affects** | What gets scaffolded | Values in scaffolded files |
| **Stored in** | `.sdd/sdd-settings.yaml` | `components/config/envs/` |

## Component Settings by Type

### Server Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `server_type` | `api\|worker\|cron\|hybrid` | `api` | Communication pattern(s) |
| `modes` | `(api\|worker\|cron)[]` | — | For hybrid: which modes (2+ required) |
| `databases` | string[] | `[]` | Database components this server uses |
| `provides_contracts` | string[] | `[]` | Contracts this server implements |
| `consumes_contracts` | string[] | `[]` | Contracts this server calls |
| `helm` | boolean | `true` | Whether to generate helm chart |

**Impact:**
- `server_type` → Operator lifecycle(s)
- `databases` → DAL layer per database, config sections
- `provides_contracts` → HTTP routes, Service in helm chart
- `consumes_contracts` → API clients, config sections
- `helm: false` → Skip helm chart scaffolding

### Webapp Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `contracts` | string[] | `[]` | Contracts this webapp uses |
| `helm` | boolean | `true` | Whether to generate helm chart |

**Impact:**
- `contracts` → API clients, config sections

### Helm Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `deploys` | string | — | Component to deploy (required) |
| `deploy_type` | `server\|webapp` | — | Type being deployed (required) |
| `deploy_modes` | `(api\|worker\|cron)[]` | — | For servers: which modes |
| `ingress` | boolean | `true` | External HTTP access |
| `assets` | `bundled\|entrypoint` | `bundled` | For webapps: asset strategy |

**Impact:**
- `deploy_modes` → Separate deployments for multi-mode
- `ingress` → ingress.yaml included/excluded
- `assets` → Webapp build strategy

### Database Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `provider` | `postgresql` | `postgresql` | Database provider |
| `dedicated` | boolean | `false` | Needs own DB server |

### Contract Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `visibility` | `public\|internal` | `internal` | External consumers allowed |

### Config Settings

Config component has no settings (it's a singleton).

## Directory Structure

Components are organized by type:

| Type | Directory |
|------|-----------|
| server | `components/servers/<name>/` |
| webapp | `components/webapps/<name>/` |
| helm | `components/helm_charts/<name>/` |
| database | `components/databases/<name>/` |
| contract | `components/contracts/<name>/` |
| config | `components/config/` (singleton) |

## Validation Rules

- **Config required**: Every project must have exactly one config component
- **Database references**: `databases` must reference existing database components
- **Contract references**: `provides_contracts`, `consumes_contracts`, `contracts` must reference existing contract components
- **Helm references**: `deploys` must reference component with `helm: true`
- **Hybrid modes**: If `server_type: hybrid`, `modes` must have 2+ entries
- **Deploy modes**: `deploy_modes` must be subset of server's available modes

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts operation type and operation-specific parameters for managing sdd-settings.yaml.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns success status, file path, and current component configurations.

## Operations

### Operation: `create`

Initialize a new settings file.

**Input:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `plugin_version` | Yes | Current SDD plugin version |
| `project_name` | Yes | Project name |
| `project_description` | Yes | Project description |
| `project_domain` | Yes | Primary domain |
| `project_type` | Yes | One of: `fullstack`, `backend`, `frontend`, `custom` |
| `components` | Yes | List of components with settings |

### Operation: `read`

Load and return current settings.

### Operation: `update`

Merge partial updates into existing settings. Triggers automatic sync of affected artifacts.

### Operation: `get_component_dirs`

Get the actual directory names for all components.

## Settings Lifecycle

```text
┌─────────────────┐
│   sdd-init      │  Settings defined during project creation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scaffolding    │  Settings drive what files/templates are created
│  (initial)      │  Settings drive initial config values
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Development    │  Settings changes come from:
│                 │  - Specs (new components, capability changes)
│                 │  - Plans (implementation decisions)
│                 │  - /sdd-settings command (manual adjustments)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Settings Sync  │  Changes propagate to config, Helm, etc.
│  (incremental)  │  Only adds/updates, never deletes user content
└─────────────────┘
```

## Naming Rules

- Names must be lowercase
- Use hyphens, not underscores
- No spaces allowed
- Names should be multi-word and domain-specific
  - Good: `order-service`, `analytics-db`, `customer-portal`, `task-api`
  - Avoid: `api`, `public`, `primary`, `main`, `server`
- Exception: `config` (singleton)

## Minimal Template (for project initialization)

Used by the `project-scaffolding` skill during `/sdd-init`:

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

## How to Reference This Skill

Other skills, agents, and commands that need settings knowledge should:

1. **Add a skill reference** in their Skills section:
   ```
   - `project-settings` — Settings schema, component types, directory mappings, and validation rules
   ```

2. **Reference instead of duplicate** — when needing to describe settings schema, validation, or directory mappings, write:
   ```
   Refer to the `project-settings` skill for the complete component settings schema, defaults, and validation rules.
   ```

3. **Reading the file is fine** — agents and skills that need to READ `.sdd/sdd-settings.yaml` at runtime should do so directly. The goal is to avoid duplicating the schema definition, not the file access.

## Related Commands

- `/sdd-settings` - View and modify settings interactively
- `/sdd-init` - Initialize project with settings
- `/sdd-config` - Manage runtime configuration
