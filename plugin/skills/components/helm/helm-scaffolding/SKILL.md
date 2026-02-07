---
name: helm-scaffolding
description: Scaffolds Helm charts for SDD components, driven by component settings.
user-invocable: false
---

# Helm Scaffolding Skill

Scaffolds Helm charts for deploying SDD components to Kubernetes. Charts are generated based on **component settings** defined in `.sdd/sdd-settings.yaml`.

## When to Use

Use when creating Helm chart components. Creates Helm charts that integrate with the SDD config system.

## Prerequisites

- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)

## Settings-Driven Scaffolding

Helm charts are scaffolded based on their settings in `.sdd/sdd-settings.yaml`:

```yaml
components:
  # Helm chart for a server
  - name: main-server-api
    type: helm
    settings:
      deploys: main-server      # Server component to deploy
      deploy_type: server
      deploy_modes: [api]       # Which modes (for hybrid servers)
      ingress: true             # External HTTP access

  # Helm chart for a webapp
  - name: admin-dashboard
    type: helm
    settings:
      deploys: admin-dashboard  # Webapp component to deploy
      deploy_type: webapp
      ingress: true
      assets: bundled           # bundled | entrypoint
```

### Settings Impact on Scaffolding

**Server helm charts:**

| Setting | Impact |
|---------|--------|
| `deploy_modes: [api]` | Single deployment with HTTP port |
| `deploy_modes: [worker]` | Single deployment without HTTP port |
| `deploy_modes: [api, worker]` | Separate deployments per mode (independent scaling) |
| `deploy_modes: [cron]` | CronJob instead of Deployment |
| `ingress: true` | Adds `ingress.yaml` for external access |
| `ingress: false` | No ingress (internal service only) |

**Webapp helm charts:**

| Setting | Impact |
|---------|--------|
| `ingress: true` | Adds `ingress.yaml` |
| `assets: bundled` | Full app files in nginx container |
| `assets: entrypoint` | Only index.html, assets from CDN |

### Template Selection Logic

```typescript
// Pseudocode for settings-driven template selection
const scaffoldHelmChart = async (helmComponent: HelmComponent): Promise<void> => {
  const { settings } = helmComponent;

  // Always include base templates
  await copyTemplate('_helpers.tpl');
  await copyTemplate('configmap.yaml');

  if (settings.deploy_type === 'server') {
    // Server-specific templates
    await copyTemplate('servicemonitor.yaml'); // All servers get metrics

    const deployModes = settings.deploy_modes ?? [serverSettings.server_type];

    if (deployModes.length > 1) {
      // Multiple modes = separate deployments per mode
      if (deployModes.includes('api')) await copyTemplate('deployment-api.yaml');
      if (deployModes.includes('worker')) await copyTemplate('deployment-worker.yaml');
      if (deployModes.includes('cron')) await copyTemplate('cronjob.yaml');
    } else if (deployModes[0] === 'cron') {
      await copyTemplate('cronjob.yaml');
    } else {
      await copyTemplate('deployment.yaml');
    }

    // Service only if deploying api mode and server provides contracts
    if (deployModes.includes('api') && serverSettings.provides_contracts.length > 0) {
      await copyTemplate('service.yaml');
    }
  } else {
    // Webapp templates
    await copyTemplate('deployment.yaml');
    await copyTemplate('service.yaml');
  }

  // Ingress from helm settings
  if (settings.ingress) {
    await copyTemplate('ingress.yaml');
  }
};
```

## Directory Structure

Helm charts live at `components/helm_charts/<name>/`:

| Component Name | Directory |
|----------------|-----------|
| `main-server-api` | `components/helm_charts/main-server-api/` |
| `admin-dashboard` | `components/helm_charts/admin-dashboard/` |
| `umbrella` | `components/helm_charts/umbrella/` |

## What It Creates

### Server Chart Structure

```text
components/helm_charts/<name>/
├── Chart.yaml                # Chart metadata
├── values.yaml               # Default values
└── templates/
    ├── _helpers.tpl          # Template helpers (always)
    ├── configmap.yaml        # Config mount (always)
    ├── servicemonitor.yaml   # Metrics integration (always)
    ├── deployment.yaml       # Single-mode deployment
    ├── deployment-api.yaml   # Hybrid: API mode deployment
    ├── deployment-worker.yaml # Hybrid: Worker mode deployment
    ├── cronjob.yaml          # Cron mode
    ├── service.yaml          # When provides_contracts (conditional)
    └── ingress.yaml          # When ingress: true (conditional)
```

### Webapp Chart Structure

```text
components/helm_charts/<name>/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── deployment.yaml       # nginx with config injection
    ├── service.yaml
    ├── configmap.yaml        # App config + nginx config
    └── ingress.yaml          # When ingress: true (conditional)
```

### Umbrella Chart Structure

```text
components/helm_charts/umbrella/
├── Chart.yaml                # Lists all charts as dependencies
└── values.yaml               # Enable/disable individual charts
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{CHART_NAME}}` | Helm chart name |
| `{{CHART_DESCRIPTION}}` | Helm chart description |
| `{{DEPLOYS_COMPONENT}}` | Name of component this chart deploys |
| `{{APP_VERSION}}` | Application version |
| `{{PROJECT_NAME}}` | Project name |
| `{{IS_HYBRID}}` | True if deploying multiple modes |
| `{{DEPLOY_MODES}}` | List of modes being deployed |
| `{{HAS_SERVICE}}` | True if server provides contracts |
| `{{HAS_INGRESS}}` | True if ingress enabled |

## Templates Location

Templates are organized by deployment target:

```text
skills/components/helm/helm-scaffolding/
├── templates/                 # Legacy (single deployment)
├── templates-server/          # Server charts
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── deployment-api.yaml
│       ├── deployment-worker.yaml
│       ├── cronjob.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── servicemonitor.yaml
│       └── configmap.yaml
├── templates-webapp/          # Webapp charts
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── configmap.yaml
└── templates-umbrella/        # Umbrella chart
    ├── Chart.yaml
    └── values.yaml
```

## Config Integration

### Server Config Injection

Config is mounted as a file at `/app/config/config.yaml`. The application reads config using the `SDD_CONFIG_PATH` environment variable:

```yaml
# templates/configmap.yaml
data:
  config.yaml: |
    {{- toYaml .Values.config | nindent 4 }}
```

The ConfigMap is mounted in deployments and `SDD_CONFIG_PATH` is set automatically.

Deployment workflow:
```bash
# Generate merged config
sdd-system config generate --env production --component main-server \
  --output production-config.yaml

# Deploy with config
helm install my-release ./components/helm_charts/main-server-api \
  -f values-production.yaml \
  --set-file config=production-config.yaml
```

### Webapp Config Injection

Config is injected into HTML at deploy time via init container:

1. Webapp exports: `export const startApp = (config: AppConfig) => { ... }`
2. Helm chart's index.html has: `startApp(__SDD_CONFIG__)`
3. Init container replaces `__SDD_CONFIG__` with JSON from ConfigMap
4. App receives config as parameter

## Observability Integration

All server charts include:

- **ServiceMonitor** - Registers app with Prometheus/Victoria Metrics
- **Metrics endpoint** - Port 9090 for health/metrics
- **Structured logging** - JSON logs to stdout (collector picks up)

Cluster-level observability (Victoria Metrics, Victoria Logs) is set up separately (see task #47).

---

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts chart name, deploy target, deployment type, and optional settings for modes, ingress, and webapp assets.

## Related Skills

- `helm-standards` — Generated Helm charts must follow these standards. Defines `values.yaml` structure, template patterns, settings-driven configuration, and release naming conventions.
