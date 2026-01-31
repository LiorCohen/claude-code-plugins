---
name: project-settings
description: Manage project settings in sdd-settings.yaml for persisting configuration choices and project state.
---

# Project Settings Skill

## Purpose

Manage the `sdd-settings.yaml` file that stores project configuration and state. This file persists project choices and can be read/updated to maintain consistency across workflows.

## File Location

Settings file: `sdd-settings.yaml` (project root, git-tracked)

## Schema

```yaml
sdd:
  plugin_version: "4.4.0"      # SDD plugin version that created this project
  initialized_at: "2026-01-27" # Date project was initialized
  last_updated: "2026-01-27"   # Date settings were last modified

project:
  name: "my-app"
  description: "A task management SaaS application"
  domain: "Task Management"
  type: "fullstack"            # fullstack | backend | frontend | custom

components:
  - type: config
    name: config
  - type: contract
    name: task-api
  - type: server
    name: task-service
  - type: webapp
    name: task-dashboard
  - type: database
    name: task-db
  - type: testing
    name: task-tests
  - type: cicd
    name: task-ci
```

The **config** component is mandatory and always the first in the list. It lives at `components/config/`.

## Component Format

Components are a list of objects. Each object has two required properties:

| Property | Required | Description |
|----------|----------|-------------|
| `type` | Yes | One of: `config`, `contract`, `server`, `webapp`, `database`, `helm`, `testing`, `cicd` |
| `name` | Yes | Instance name (lowercase, hyphens only) |

**Directory derivation:** `components/{type}-{name}/` when type ≠ name, `components/{type}/` when type = name.

**Single instance (type = name):**
- `{type: server, name: server}` → `components/server/`

**Multiple instances:**
- `{type: server, name: order-service}` → `components/server-order-service/`
- `{type: server, name: notification-worker}` → `components/server-notification-worker/`

### Naming Rules

- Names must be lowercase
- Use hyphens, not underscores
- No spaces allowed
- Names should be domain-specific and descriptive, not generic
  - Good: `order-service`, `analytics-db`, `customer-portal`, `task-api`
  - Avoid: `api`, `public`, `primary`, `main`
- When only one instance of a type exists, name = type is technically valid but discouraged — it's not future-proof if a second instance is added later. Prefer a domain-specific name even for single instances.

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
| `components` | Yes | List of `{type, name}` objects |

**Workflow:**

1. Check if `sdd-settings.yaml` already exists
   - If exists: Warn and ask for confirmation to overwrite
   - If confirmed or doesn't exist: Continue

2. Get current date in `YYYY-MM-DD` format

3. Create settings object:
   ```yaml
   sdd:
     plugin_version: <plugin_version>
     initialized_at: <current_date>
     last_updated: <current_date>

   project:
     name: <project_name>
     description: <project_description>
     domain: <project_domain>
     type: <project_type>

   components:
     - type: <type>
       name: <name>
     # ... for each component
   ```

4. Write to `sdd-settings.yaml` with proper YAML formatting

5. Return:
   ```yaml
   success: true
   path: sdd-settings.yaml
   ```

**Example - Standard Full-Stack:**

```
Input:
  plugin_version: "4.4.0"
  project_name: "my-app"
  project_description: "A task management SaaS application"
  project_domain: "Task Management"
  project_type: "fullstack"
  components:
    - type: config
      name: config
    - type: contract
      name: task-api
    - type: server
      name: task-service
    - type: webapp
      name: task-dashboard
    - type: testing
      name: task-tests
    - type: cicd
      name: task-ci

Output:
  success: true
  path: sdd-settings.yaml
```

**Example - Multi-Component:**

```
Input:
  plugin_version: "4.4.0"
  project_name: "my-platform"
  project_description: "A multi-tenant SaaS platform"
  project_domain: "Platform"
  project_type: "custom"
  components:
    - type: config
      name: config
    - type: contract
      name: customer-api
    - type: contract
      name: back-office-api
    - type: server
      name: order-service
    - type: server
      name: notification-worker
    - type: server
      name: task-scheduler
    - type: webapp
      name: back-office
    - type: webapp
      name: customer-portal
    - type: database
      name: app-db
    - type: database
      name: analytics-db
    - type: helm
      name: platform-deploy
    - type: testing
      name: platform-tests
    - type: cicd
      name: platform-ci

Output:
  success: true
  path: sdd-settings.yaml
```

---

### Operation: `read`

Load and return current settings.

**Input:**

None (reads from standard location)

**Workflow:**

1. Check if `sdd-settings.yaml` exists
   - If not: Return error with `exists: false`

2. Read and parse YAML file

3. Validate required fields exist:
   - `sdd.plugin_version`
   - `sdd.initialized_at`
   - `project.name`
   - `project.type`
   - `components` (list)

4. Return parsed settings

**Output:**

```yaml
exists: true
settings:
  sdd:
    plugin_version: "4.4.0"
    initialized_at: "2026-01-27"
    last_updated: "2026-01-27"
  project:
    name: "my-app"
    description: "A task management SaaS application"
    domain: "Task Management"
    type: "fullstack"
  components:
    - type: config
      name: config
    - type: contract
      name: task-api
    - type: server
      name: task-service
    - type: webapp
      name: task-dashboard
    - type: testing
      name: task-tests
    - type: cicd
      name: task-ci
```

**Error Output (file not found):**

```yaml
exists: false
error: "sdd-settings.yaml not found."
```

---

### Operation: `update`

Merge partial updates into existing settings.

**Input:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `updates` | Yes | Partial settings object to merge |

**Workflow:**

1. Call `read` operation to get current settings
   - If file doesn't exist: Return error

2. Deep merge `updates` into current settings:
   - Top-level keys in `updates` replace corresponding keys
   - Nested objects are merged recursively
   - `components` list: replaces the entire list (no list merging)
   - `null` values remove keys

3. Update `sdd.last_updated` to current date

4. Write merged settings to `sdd-settings.yaml`

5. Return updated settings

**Example - Replace components list:**

```
Input:
  updates:
    components:
      - type: contract
        name: task-api
      - type: server
        name: order-service
      - type: server
        name: notification-worker
      - type: webapp
        name: task-dashboard

Output:
  success: true
  settings:
    # ... (components is now the new list, last_updated changed)
```

---

### Operation: `get_component_dirs`

Get the actual directory names for all components.

**Input:**

None (reads from settings)

**Output:**

```yaml
directories:
  - type: config
    name: config
    dir: "components/config"
  - type: contract
    name: task-api
    dir: "components/contract-task-api"
  - type: server
    name: order-service
    dir: "components/server-order-service"
  - type: server
    name: notification-worker
    dir: "components/server-notification-worker"
  - type: webapp
    name: task-dashboard
    dir: "components/webapp-task-dashboard"
  - type: database
    name: app-db
    dir: "components/database-app-db"
```

This operation is useful for agents that need to know which directories exist.

---

## Error Handling

| Error | Handling |
|-------|----------|
| File not found (read/update) | Return `exists: false` with helpful message |
| Invalid YAML | Return parse error with line number if possible |
| Missing required fields | Return validation error listing missing fields |
| Permission denied | Return error with suggestion to check file permissions |
| File exists (create) | Warn and ask for confirmation before overwriting |

## Validation

### Project Type Values

Valid values for `project.type`:
- `fullstack` - Full-stack application (contract + server + webapp)
- `backend` - Backend API only (contract + server)
- `frontend` - Frontend only (webapp)
- `custom` - Custom component selection

### Component Values

Each component is an object with:
- `type` (required) — one of: `config`, `contract`, `server`, `webapp`, `database`, `helm`, `testing`, `cicd`
- `name` (required) — lowercase, hyphens only, no spaces. Should be domain-specific and descriptive (e.g., `order-service`, `user-dashboard`), not generic (e.g., avoid `api`, `public`, `primary`). When there's only one instance of a type, name = type is technically valid but discouraged — it's not future-proof if a second instance is added later. Prefer a domain-specific name even for single instances.

Directory: `components/{type}/` when name = type, `components/{type}-{name}/` otherwise.

### Config Component (Mandatory Singleton)

The `config` component is **mandatory** and must appear exactly once in every project:
- Type: `config`
- Name: `config` (always, no variations allowed)
- Directory: `components/config/`

This component holds centralized configuration for all other components. It is scaffolded first during project initialization and cannot be removed.
