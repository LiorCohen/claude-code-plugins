---
name: sdd-settings
description: View and modify component settings in sdd-settings.yaml
---

# /sdd-settings Command

View and modify component settings stored in `.sdd/sdd-settings.yaml`.

## Usage

```bash
# View all component settings
/sdd-settings

# View specific component
/sdd-settings main-server

# Modify a setting
/sdd-settings main-server databases add primary-db
/sdd-settings main-server ingress true
```

## What Are Settings?

**Settings** are structural decisions about a component that affect scaffolding, config, and deployment.

| Aspect | Settings | Config |
|--------|----------|--------|
| **What** | Structural capabilities | Runtime values |
| **When set** | At component creation, changeable | Per-environment |
| **Examples** | `databases`, `provides_contracts`, `server_type` | `port: 3000`, `replicas: 3` |
| **Affects** | What gets scaffolded | Values in scaffolded files |
| **Stored in** | `.sdd/sdd-settings.yaml` | `components/config/envs/` |

## Operations

### View All Settings

```
/sdd-settings
```

Displays all components and their settings grouped by type.

### View Component Settings

```
/sdd-settings <component-name>
```

Displays settings for a specific component.

### Modify Settings

```
/sdd-settings <component> <setting> <action> [value]
```

**Actions for array settings:**
- `add <value>` - Add to array
- `remove <value>` - Remove from array

**Actions for boolean settings:**
- `true` or `false` - Set value

**Actions for enum settings:**
- `<value>` - Set to valid enum value

## Setting Changes Workflow

When you modify settings, the following happens automatically:

1. **Working tree check** - If uncommitted changes exist:
   ```
   You have uncommitted changes in:
   - components/servers/main-server/model/user.ts
   - components/config/envs/default/config.yaml

   Settings changes may modify these files. Options:
   [1] Auto-commit current changes (recommended)
   [2] Continue without committing (risky)
   [3] Cancel
   ```

2. **Validation** - Verify the change is valid (e.g., referenced component exists)

3. **Preview** - Show what will happen:
   ```
   Adding database 'reporting-db' to main-server will:
   - Add DAL layer for reporting-db in components/servers/main-server/dal/
   - Add database config section in components/config/envs/*/config.yaml
   - Update helm chart values with new DB connection

   Proceed? [y/n]
   ```

4. **Apply** - Update `.sdd/sdd-settings.yaml`

5. **Sync** - Automatically scaffold/update affected artifacts

6. **Report** - Show what was created/modified

## Settings by Component Type

### Server Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `server_type` | `api\|worker\|cron\|hybrid` | `api` | Communication pattern(s) |
| `modes` | `(api\|worker\|cron)[]` | — | For hybrid: which modes (2+ required) |
| `databases` | string[] | `[]` | Database components this server uses |
| `provides_contracts` | string[] | `[]` | Contracts this server implements |
| `consumes_contracts` | string[] | `[]` | Contracts this server calls |
| `helm` | boolean | `true` | Whether to generate helm chart |

**Examples:**
```bash
/sdd-settings main-server databases add analytics-db
/sdd-settings main-server provides_contracts add admin-api
/sdd-settings main-server server_type hybrid
/sdd-settings main-server modes add cron
```

### Webapp Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `contracts` | string[] | `[]` | Contract components this webapp uses |
| `helm` | boolean | `true` | Whether to generate helm chart |

**Examples:**
```bash
/sdd-settings admin-dashboard contracts add admin-api
/sdd-settings admin-dashboard helm false
```

### Helm Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `deploys` | string | — | Component this chart deploys (required) |
| `deploy_type` | `server\|webapp` | — | Type being deployed (required) |
| `deploy_modes` | `(api\|worker\|cron)[]` | — | For servers: which modes |
| `ingress` | boolean | `true` | External HTTP access |
| `assets` | `bundled\|entrypoint` | `bundled` | For webapps: asset strategy |

**Examples:**
```bash
/sdd-settings main-server-api ingress false
/sdd-settings main-server-api deploy_modes add worker
/sdd-settings admin-dashboard-helm assets entrypoint
```

### Database Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `provider` | `postgresql` | `postgresql` | Database provider |
| `dedicated` | boolean | `false` | Needs own DB server |

### Contract Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `visibility` | `public\|internal` | `internal` | External consumers allowed |

## Validation Rules

Settings changes are validated before applying:

- **Database references**: `databases` must reference existing database components
- **Contract references**: `provides_contracts`, `consumes_contracts`, and `contracts` must reference existing contract components
- **Helm references**: `deploys` must reference a component with `helm: true`
- **Hybrid modes**: If `server_type` is `hybrid`, `modes` must have 2+ entries
- **Deploy modes**: `deploy_modes` must be a subset of the server's available modes

## Examples

### Add Database to Server

```
/sdd-settings main-server databases add analytics-db
```

Result:
- Adds DAL layer at `components/servers/main-server/dal/analytics-db/`
- Adds config section:
  ```yaml
  main-server:
    databases:
      analytics-db:
        host: localhost
        port: 5432
        name: main_server
        ssl: false
  ```

### Enable Ingress on Helm Chart

```
/sdd-settings main-server-api ingress true
```

Result:
- Adds `templates/ingress.yaml` to the helm chart
- Updates `values.yaml` with ingress configuration

### Convert Server to Hybrid

```
/sdd-settings main-server server_type hybrid
/sdd-settings main-server modes add api
/sdd-settings main-server modes add worker
```

Result:
- Updates server scaffolding with multiple lifecycles
- Updates helm chart with separate deployments per mode
- Updates config with queue settings for worker mode

## Related Commands

- `/sdd-init` - Initialize project with initial settings
- `/sdd-config` - Manage runtime configuration
- `/sdd-change` - Create changes that may affect settings
