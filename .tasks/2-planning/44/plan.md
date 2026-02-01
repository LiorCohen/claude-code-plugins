---
title: Component settings system + Helm charts
created: 2026-02-01
updated: 2026-02-01
---

# Plan: Component Settings System + Helm Charts

## Problem Summary

Components lack a formal settings system. Currently:
- No structured way to define component capabilities (uses DB, needs ingress, etc.)
- Scaffolding doesn't adapt based on component needs
- Config initialization is generic, not component-aware
- Helm charts are one-size-fits-all
- No way to change component structure post-init

This task introduces **component settings** as a first-class concept, using Helm charts as the practical test case.

Consolidates #46 (Missing Helm chart template) and #53 (Missing helm-standards skill).

## Architecture

### What Are Component Settings?

**Settings** are structural decisions about a component that affect scaffolding, config, and deployment.

**Settings vs Config:**
| Aspect | Settings | Config |
|--------|----------|--------|
| **What** | Structural capabilities | Runtime values |
| **When set** | At component creation, changeable | Per-environment |
| **Examples** | `uses_database`, `ingress`, `server_type` | `port: 3000`, `replicas: 3` |
| **Affects** | What gets scaffolded | Values in scaffolded files |
| **Stored in** | `sdd-settings.yaml` component entry | `components/config/envs/` |

### Component Settings Schemas

```yaml
# sdd-settings.yaml
components:
  # === SERVER ===
  - name: api
    type: server
    settings:
      server_type: api          # api | worker | cron | hybrid
      uses_database: true       # Adds DB config section, DAL layer
      ingress: true             # Adds ingress.yaml to Helm
      exposes_api: true         # Adds Service, contract dependency

  - name: worker
    type: server
    settings:
      server_type: worker
      uses_database: true
      ingress: false
      exposes_api: false

  - name: all-in-one
    type: server
    settings:
      server_type: hybrid       # All modes: api + worker + cron
      uses_database: true
      ingress: true
      exposes_api: true

  # === WEBAPP ===
  - name: admin
    type: webapp
    settings:
      uses_api: true            # Depends on contract, generates API client
      helm: true                # Generate Helm chart for k8s deployment
      helm_assets: bundled      # bundled = full app | entrypoint = index.html only
      ingress: true             # Needs external exposure (requires helm: true)

  # === DATABASE ===
  - name: main
    type: database
    settings:
      provider: postgresql      # Only postgresql for now
      dedicated: false          # false = can share server with other DBs (local dev)

  # === CONTRACT ===
  - name: public-api
    type: contract
    settings:
      visibility: public        # public | internal

  # === CONFIG ===
  - name: config
    type: config
    settings: {}                # No settings - singleton, serves all components
```

### Settings by Component Type

| Component | Setting | Type | Default | Description |
|-----------|---------|------|---------|-------------|
| **server** | `server_type` | `api\|worker\|cron\|hybrid` | `api` | Communication pattern(s) |
| | `uses_database` | boolean | `false` | Enables DAL layer, DB config |
| | `ingress` | boolean | `true` | External HTTP exposure |
| | `exposes_api` | boolean | `true` | HTTP business API with contract |
| **webapp** | `uses_api` | boolean | `true` | Depends on contract component |
| | `helm` | boolean | `true` | Generate Helm chart for k8s deployment |
| | `helm_assets` | `bundled\|entrypoint` | `bundled` | bundled = full app, entrypoint = index.html only |
| | `ingress` | boolean | `true` | External HTTP exposure (requires helm) |
| **database** | `provider` | `postgresql` | `postgresql` | Database provider |
| | `dedicated` | boolean | `false` | Needs own DB server (false = colocate) |
| **contract** | `visibility` | `public\|internal` | `internal` | Public = external consumers, internal = project-only |
| **config** | — | — | — | No settings (singleton) |

### Settings Impact Matrix

**Note:** Model layer always exists (business logic). Controller layer always exists (communication/coordination). Settings affect their *contents*, not their existence.

| Setting | Operator Impact | Controller Impact | DAL Impact | Config Impact | Helm Impact |
|---------|-----------------|-------------------|------------|---------------|-------------|
| `server_type: api` | HTTP server lifecycle | HTTP route handlers | — | API port, HTTP settings | Deployment, Service |
| `server_type: worker` | Queue consumer lifecycle | Message handlers | — | Queue connection | Deployment |
| `server_type: cron` | Scheduler lifecycle | Job execution handlers | — | Schedule definitions | CronJob |
| `server_type: hybrid` | All three lifecycles | All three handler types | — | All config sections | 2 Deployments + CronJob |
| `uses_database` | DB connection init | — | DAL layer created | DB connection section | DB secret refs |
| `ingress` | — | — | — | Hostname, paths | ingress.yaml |
| `exposes_api` | — | HTTP business handlers | — | Contract ref, API port | Service for API port |

**Webapp settings:**
| Setting | Scaffolding Impact | Config Impact | Helm Impact |
|---------|-------------------|---------------|-------------|
| `uses_api` | API client generated | API base URL | — |
| `helm` | — | — | Helm chart generated |
| `helm_assets` | — | — | bundled = nginx + files, entrypoint = nginx + index.html |
| `ingress` | — | Hostname, paths | ingress.yaml (requires helm) |

**Clarifications:**
- `server_type` determines the communication pattern(s) and Operator lifecycle(s)
- `server_type: hybrid` creates one Helm chart with 2 Deployments (api, worker) + 1 CronJob, each independently scalable
- `exposes_api` is orthogonal - a worker could expose a small HTTP API for admin/status
- All servers get health + metrics endpoints (port 9090) regardless of settings
- `exposes_api` specifically means "has business API with contract" (port 3000)
- Webapp config is injected into HTML at deploy time via ConfigMap

### Settings Lifecycle

```
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
│  Development    │  Settings can be changed via sdd-settings command
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Settings Sync  │  Changes propagate to config, Helm, etc.
│  (incremental)  │  Only adds/updates, never deletes user content
└─────────────────┘
```

### Chart-per-Server Pattern

Each server component gets its own Helm chart, driven by its settings.

```
components/
├── helm-server-api/           # Chart for server-api
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── servicemonitor.yaml
├── helm-server-worker/        # Chart for server-worker (no ingress)
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       └── servicemonitor.yaml
├── helm-server-all-in-one/    # Hybrid chart - 2 deployments + 1 cronjob
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment-api.yaml
│       ├── deployment-worker.yaml
│       ├── cronjob.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── servicemonitor.yaml
├── helm-webapp-admin/         # Chart for webapp-admin
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml    # nginx serving static files
│       ├── service.yaml
│       ├── ingress.yaml
│       └── configmap.yaml     # Config injected into HTML
└── helm-umbrella/             # Optional: installs all charts together
    ├── Chart.yaml
    └── values.yaml
```

### Webapp Helm Pattern

Webapps are SPAs served by nginx with config injected at deploy time.

**Config injection flow:**
1. Webapp source exports entry point: `export const startApp = (config: AppConfig) => { ... }`
2. Webapp builds to static JS files (no knowledge of deployment)
3. **Helm chart** provides `index.html` template with placeholder: `startApp(__SDD_CONFIG__)`
4. At deploy time, init container replaces `__SDD_CONFIG__` with actual config JSON
5. App receives config as parameter - completely unaware of injection mechanism

**Key separation:** The `__SDD_CONFIG__` placeholder lives in the Helm chart's HTML template, not in webapp source. Webapp just exports a function that takes config.

**Helm chart's index.html template:**
```html
<script type="module">
  import { startApp } from './main.js';
  startApp(__SDD_CONFIG__);
</script>
```

**deployment.yaml for webapp:**
```yaml
initContainers:
  - name: inject-config
    image: busybox
    command: ['sh', '-c', 'sed -i "s/__SDD_CONFIG__/$CONFIG_JSON/" /app/index.html']
    env:
      - name: CONFIG_JSON
        valueFrom:
          configMapKeyRef:
            name: {{ .Release.Name }}-config
            key: config.json
    volumeMounts:
      - name: static-files
        mountPath: /app
containers:
  - name: nginx
    image: nginx:alpine
    volumeMounts:
      - name: static-files
        mountPath: /usr/share/nginx/html
```

### Observability Integration

**Key principle:** Observability infrastructure is cluster-level, not app-level.

- **Cluster infrastructure** (Victoria Metrics, Victoria Logs in `telemetry` namespace) → Handled by task #47
- **App integration** (this task) → Helm templates that integrate with existing observability

App Helm charts provide:
- ServiceMonitor CRD (registers app with Victoria Metrics)
- Structured JSON logs to stdout (Victoria Logs collector picks them up)
- Metrics endpoint (port 9090)

## Files to Modify

| File | Changes |
|------|---------|
| **Settings System** | |
| `plugin/system/src/types/settings.ts` | **NEW** - TypeScript types for component settings |
| `plugin/system/src/settings/schema.ts` | **NEW** - JSON Schema for settings validation |
| `plugin/system/src/settings/defaults.ts` | **NEW** - Default settings per component type |
| `plugin/skills/project-settings/SKILL.md` | Document settings schema and usage |
| **Scaffolding Integration** | |
| `plugin/system/src/commands/scaffolding/project.ts` | Read settings, pass to component scaffolders |
| `plugin/skills/backend-scaffolding/SKILL.md` | Document settings-driven scaffolding |
| `plugin/skills/config-scaffolding/SKILL.md` | Document settings-driven config initialization |
| **Helm Scaffolding** | |
| `plugin/skills/helm-scaffolding/SKILL.md` | Document settings-driven chart generation |
| `plugin/skills/helm-scaffolding/templates/` | Conditional templates based on settings |
| `plugin/skills/helm-scaffolding/templates-umbrella/` | **NEW** - Umbrella chart template |
| `plugin/system/src/commands/scaffolding/sync-helm.ts` | **NEW** - Sync command for servers + webapps |
| `plugin/skills/helm-scaffolding/templates-webapp/` | **NEW** - Webapp Helm chart template |
| **Standards & Agents** | |
| `plugin/skills/helm-standards/SKILL.md` | Expand with settings patterns, observability |
| `plugin/agents/devops.md` | Add observability stack setup |
| **Settings Mutation** | |
| `plugin/commands/sdd-settings.md` | **NEW** - Command to view/change settings |
| `plugin/system/src/commands/settings/sync.ts` | **NEW** - Propagate settings changes |

## Implementation

### Phase 1: Settings Type System

Define TypeScript types and JSON Schema for component settings.

**`plugin/system/src/types/settings.ts`:**
```typescript
export type ServerType = 'api' | 'worker' | 'cron' | 'hybrid';

export interface ServerSettings {
  readonly server_type: ServerType;
  readonly uses_database: boolean;
  readonly ingress: boolean;
  readonly exposes_api: boolean;
}

export type HelmAssets = 'bundled' | 'entrypoint';

export interface WebappSettings {
  readonly uses_api: boolean;
  readonly helm: boolean;
  readonly helm_assets: HelmAssets;
  readonly ingress: boolean;
}

export interface DatabaseSettings {
  readonly provider: 'postgresql';
  readonly dedicated: boolean;
}

export type ContractVisibility = 'public' | 'internal';

export interface ContractSettings {
  readonly visibility: ContractVisibility;
}

export type ComponentSettings =
  | { readonly type: 'server'; readonly settings: ServerSettings }
  | { readonly type: 'webapp'; readonly settings: WebappSettings }
  | { readonly type: 'database'; readonly settings: DatabaseSettings }
  | { readonly type: 'contract'; readonly settings: ContractSettings }
  | { readonly type: 'config'; readonly settings: Record<string, never> };
```

**`plugin/system/src/settings/defaults.ts`:**
```typescript
// Server defaults
export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  server_type: 'api',
  uses_database: false,
  ingress: true,
  exposes_api: true,
};

export const DEFAULT_WORKER_SETTINGS: ServerSettings = {
  server_type: 'worker',
  uses_database: false,
  ingress: false,
  exposes_api: false,
};

export const DEFAULT_HYBRID_SETTINGS: ServerSettings = {
  server_type: 'hybrid',
  uses_database: false,
  ingress: true,
  exposes_api: true,
};

// Webapp defaults
export const DEFAULT_WEBAPP_SETTINGS: WebappSettings = {
  uses_api: true,
  helm: true,
  helm_assets: 'bundled',
  ingress: true,
};

// Database defaults
export const DEFAULT_DATABASE_SETTINGS: DatabaseSettings = {
  provider: 'postgresql',
  dedicated: false,
};

// Contract defaults
export const DEFAULT_CONTRACT_SETTINGS: ContractSettings = {
  visibility: 'internal',
};
```

### Phase 2: Settings-Driven Backend Scaffolding

Update backend scaffolding to read settings and conditionally scaffold.

**Conditional scaffolding logic:**
```typescript
const scaffoldServer = async (
  projectDir: string,
  component: Component,
  settings: ServerSettings
): Promise<void> => {
  // Always scaffold: config, operator, model/definitions
  await scaffoldCore(projectDir, component);

  // Conditional: controller layer (only for API servers)
  if (settings.exposes_api) {
    await scaffoldController(projectDir, component);
  }

  // Conditional: DAL layer (only if uses database)
  if (settings.uses_database) {
    await scaffoldDAL(projectDir, component);
  }
};
```

### Phase 3: Settings-Driven Config Initialization

Update config scaffolding to generate initial config sections based on settings.

**Example: Server with `uses_database: true`:**
```yaml
# components/config/envs/default/config.yaml
server-api:
  port: 3000
  database:                    # Added because uses_database=true
    host: localhost
    port: 5432
    name: myapp
    ssl: false
```

**Example: Server with `uses_database: false`:**
```yaml
# components/config/envs/default/config.yaml
server-api:
  port: 3000
  # No database section
```

### Phase 4: Helm Template System

Create conditional Helm templates that render based on settings.

**Template structure:**
```
plugin/skills/helm-scaffolding/templates/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml           # Always included
│   ├── service.yaml.conditional  # Only if exposes_api=true
│   ├── ingress.yaml.conditional  # Only if ingress=true
│   ├── servicemonitor.yaml       # Always included (all servers expose metrics)
│   ├── cronjob.yaml.conditional  # Only if server_type=cron
│   └── configmap.yaml            # Always included
```

**Scaffolding reads settings and copies only applicable templates:**
```typescript
const scaffoldHelmChart = async (
  projectDir: string,
  component: Component,
  settings: ServerSettings
): Promise<void> => {
  const helmDir = path.join(projectDir, 'components', `helm-${component.type}-${component.name}`);

  // Always copy base templates
  await copyTemplate('deployment.yaml', helmDir);
  await copyTemplate('configmap.yaml', helmDir);
  await copyTemplate('servicemonitor.yaml', helmDir);  // All servers expose metrics
  await copyTemplate('_helpers.tpl', helmDir);

  // Conditional templates based on settings
  if (settings.exposes_api) {
    await copyTemplate('service.yaml', helmDir);
  }
  if (settings.ingress) {
    await copyTemplate('ingress.yaml', helmDir);
  }
  if (settings.server_type === 'cron') {
    await copyTemplate('cronjob.yaml', helmDir);
    // Don't copy deployment.yaml for cron jobs
  }
  if (settings.server_type === 'hybrid') {
    // Hybrid: 2 deployments + cronjob, independently scalable
    await copyTemplate('deployment-api.yaml', helmDir);
    await copyTemplate('deployment-worker.yaml', helmDir);
    await copyTemplate('cronjob.yaml', helmDir);
    // Remove the generic deployment.yaml
  }
};
```

### Phase 5: Helm Values Generation

Generate `values.yaml` based on settings.

**API server (ingress=true, exposes_api=true):**
```yaml
replicaCount: 1
image:
  repository: {{CHART_NAME}}
  tag: latest

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix

observability:
  metrics:
    enabled: true
    port: 9090
    serviceMonitor:
      enabled: false
      interval: 30s
```

**Worker (ingress=false, exposes_api=false):**
```yaml
replicaCount: 1
image:
  repository: {{CHART_NAME}}
  tag: latest

# No service section - worker doesn't expose API
# No ingress section - worker doesn't need external access

observability:
  metrics:
    enabled: true
    port: 9090
    serviceMonitor:
      enabled: false
      interval: 30s
```

**Hybrid server (2 deployments + cronjob, independently scalable):**
```yaml
image:
  repository: {{CHART_NAME}}
  tag: latest

# Each mode gets its own deployment with independent scaling
api:
  enabled: true
  replicaCount: 2
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"

worker:
  enabled: true
  replicaCount: 5          # Scale workers independently
  resources:
    requests:
      memory: "512Mi"
      cpu: "200m"

cron:
  enabled: true
  schedule: "0 * * * *"    # Hourly

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix

observability:
  metrics:
    enabled: true
    port: 9090
    serviceMonitor:
      enabled: false
      interval: 30s
```

### Phase 6: Umbrella Chart Template

Create umbrella chart for multi-server projects.

**Chart.yaml template:**
```yaml
apiVersion: v2
name: {{PROJECT_NAME}}
description: Umbrella chart for {{PROJECT_NAME}}
type: application
version: 0.1.0
dependencies:
  {{#each deployables}}
  - name: helm-{{type}}-{{name}}
    version: "0.1.0"
    repository: "file://../helm-{{type}}-{{name}}"
  {{/each}}
```

### Phase 7: Sync Commands

Create commands for incremental scaffolding when settings change.

**`sdd-system scaffolding sync-helm`:**
```typescript
export const syncHelm = async (projectDir: string): Promise<void> => {
  const settings = await loadSettings(projectDir);

  // Sync server Helm charts
  const servers = settings.components.filter(c => c.type === 'server');
  for (const server of servers) {
    const helmDir = path.join(projectDir, 'components', `helm-server-${server.name}`);
    if (!await exists(helmDir)) {
      await scaffoldServerHelmChart(projectDir, server, server.settings);
    } else {
      await syncHelmTemplates(helmDir, server.settings);
    }
  }

  // Sync webapp Helm charts (only if helm: true)
  const webapps = settings.components.filter(c => c.type === 'webapp' && c.settings.helm);
  for (const webapp of webapps) {
    const helmDir = path.join(projectDir, 'components', `helm-webapp-${webapp.name}`);
    if (!await exists(helmDir)) {
      await scaffoldWebappHelmChart(projectDir, webapp, webapp.settings);
    } else {
      await syncHelmTemplates(helmDir, webapp.settings);
    }
  }

  // Handle umbrella chart (servers + webapps)
  const allDeployables = [...servers, ...webapps];
  if (allDeployables.length >= 2) {
    await syncUmbrellaChart(projectDir, allDeployables);
  }
};
```

**`sdd-system settings sync`:**
Propagates settings changes to all affected artifacts (config, helm, etc.).

### Phase 8: Settings Command

Create `/sdd-settings` command for viewing and modifying settings.

**Usage:**
```bash
# View all component settings
/sdd-settings

# View specific component
/sdd-settings server-api

# Change a setting
/sdd-settings server-api uses_database true

# After change, sync affected artifacts
sdd-system settings sync
```

### Phase 9: Update Standards and Documentation

**helm-standards skill:**
- Settings-driven chart generation
- Chart-per-server pattern
- Observability integration patterns

**devops.md agent:**
- How app charts integrate with cluster observability (ServiceMonitor, structured logs)
- Reference task #47 for cluster infrastructure setup

**project-settings skill:**
- Full settings schema documentation
- Settings lifecycle
- How to change settings post-init

## Verification

1. **Settings validation**
   - JSON Schema validates all settings in sdd-settings.yaml
   - TypeScript types match schema

2. **Scaffolding correctness**
   - Server with `uses_database: true` gets DAL layer
   - Server with `ingress: false` gets no ingress.yaml in Helm
   - Worker servers get no Service resource

3. **Config initialization**
   - Initial config reflects settings
   - Database section only present when `uses_database: true`

4. **Sync correctness**
   - Adding `ingress: true` to existing server adds ingress.yaml
   - Sync never deletes user-modified content

5. **Helm template rendering**
   - `helm template` works for all setting combinations
   - No orphan template references

## Out of Scope

- Cluster-level observability setup (Victoria Metrics, Victoria Logs) → Task #47
- Database provider options beyond PostgreSQL
- Grafana dashboard templates
- Alert rule templates (VMRule CRDs)
- Multi-cluster federation

## Dependencies

- **Task #47** (local-env management) - For cluster-level observability (Victoria Metrics/Logs). App Helm charts can be developed independently but need #47 for full observability testing.
