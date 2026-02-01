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
| **Examples** | `databases`, `provides_contracts`, `server_type` | `port: 3000`, `replicas: 3` |
| **Affects** | What gets scaffolded | Values in scaffolded files |
| **Stored in** | `sdd-settings.yaml` component entry | `components/config/envs/` |

### Component Settings Schemas

```yaml
# sdd-settings.yaml
components:
  # === SERVER ===
  - name: main-server
    type: server
    settings:
      server_type: hybrid       # Supports multiple modes
      modes: [api, worker]      # Any 2+ of: api, worker, cron
      databases: [primary-db]   # Database components this server uses
      provides_contracts: [public-api]   # Contracts this server implements
      consumes_contracts: []             # Contracts this server calls
      helm: true                # Needs a helm chart for deployment

  - name: background-worker
    type: server
    settings:
      server_type: worker
      databases: [primary-db]   # Can share database with main-server
      provides_contracts: []
      consumes_contracts: [public-api]   # Worker calls main-server's API
      helm: true

  # === WEBAPP ===
  - name: admin-dashboard
    type: webapp
    settings:
      contracts: [public-api]   # Which contracts this webapp uses (generates API clients)
      helm: true                # Needs a helm chart for deployment

  # === HELM ===
  - name: main-server-api
    type: helm
    settings:
      deploys: main-server      # References server component
      deploy_type: server       # server | webapp
      deploy_modes: [api]       # Run only api mode from the hybrid server
      ingress: true             # Adds ingress.yaml

  - name: main-server-hybrid
    type: helm
    settings:
      deploys: main-server
      deploy_type: server
      deploy_modes: [api, worker]  # Run both api and worker modes
      ingress: true

  - name: background-worker
    type: helm
    settings:
      deploys: background-worker
      deploy_type: server
      ingress: false

  - name: admin-dashboard
    type: helm
    settings:
      deploys: admin-dashboard
      deploy_type: webapp
      ingress: true
      assets: bundled           # bundled = full app | entrypoint = index.html only

  # === DATABASE ===
  - name: primary-db
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
    settings: {}                # Singleton, serves all components (exception to naming rule)
```

### Settings by Component Type

| Component | Setting | Type | Default | Description |
|-----------|---------|------|---------|-------------|
| **server** | `server_type` | `api\|worker\|cron\|hybrid` | `api` | Communication pattern(s) |
| | `modes` | `(api\|worker\|cron)[]` | — | For hybrid: which modes (2+ required) |
| | `databases` | string[] | `[]` | Database components this server uses (adds DAL, DB config) |
| | `provides_contracts` | string[] | `[]` | Contracts this server implements (adds Service, routes) |
| | `consumes_contracts` | string[] | `[]` | Contracts this server calls (generates API clients) |
| | `helm` | boolean | `true` | Whether this server needs a helm chart |
| **webapp** | `contracts` | string[] | `[]` | Contract components this webapp uses (generates API clients) |
| | `helm` | boolean | `true` | Whether this webapp needs a helm chart |
| **helm** | `deploys` | string | — | Name of component this chart deploys (required) |
| | `deploy_type` | `server\|webapp` | — | Type of component being deployed (required) |
| | `deploy_modes` | `(api\|worker\|cron)[]` | — | For servers: which modes to deploy (subset of server's modes) |
| | `ingress` | boolean | `true` | External HTTP exposure |
| | `assets` | `bundled\|entrypoint` | `bundled` | For webapps: bundled = full app, entrypoint = index.html only |
| **database** | `provider` | `postgresql` | `postgresql` | Database provider |
| | `dedicated` | boolean | `false` | Needs own DB server (false = colocate) |
| **contract** | `visibility` | `public\|internal` | `internal` | Public = external consumers, internal = project-only |
| **config** | — | — | — | No settings (singleton) |

### Settings Impact Matrix

**Note:** Model layer always exists (business logic). Controller layer always exists (communication/coordination). Settings affect their *contents*, not their existence.

**Server settings impact:**
| Setting | Operator Impact | Controller Impact | DAL Impact | Config Impact |
|---------|-----------------|-------------------|------------|---------------|
| `server_type: api` | HTTP server lifecycle | HTTP route handlers | — | API port, HTTP settings |
| `server_type: worker` | Queue consumer lifecycle | Message handlers | — | Queue connection |
| `server_type: cron` | Scheduler lifecycle | Job execution handlers | — | Schedule definitions |
| `server_type: hybrid` | Lifecycles for each mode in `modes` | Handler types for each mode | — | Config sections for each mode |
| `databases` | DB connection init per database | — | DAL layer per database | DB connection section per database |
| `provides_contracts` | — | HTTP route handlers per contract | — | API port |
| `consumes_contracts` | — | API clients generated | — | Base URLs per contract |

**Webapp settings impact:**
| Setting | Scaffolding Impact | Config Impact |
|---------|-------------------|---------------|
| `contracts` | API client generated per contract | API base URLs for each contract |

**Helm settings impact:**
| Setting | Chart Impact |
|---------|-------------|
| `deploys` | Which component's image to deploy |
| `deploy_type: server` | Deployment, Service (if provides_contracts), ServiceMonitor |
| `deploy_type: webapp` | Deployment (nginx), Service, ConfigMap |
| `deploy_modes` | Which modes to run (for hybrid servers: subset of available modes) |
| `ingress` | ingress.yaml added |
| `assets: bundled` | Full app files in container |
| `assets: entrypoint` | Only index.html, assets from CDN |

**Naming conventions:**
- Component names must be multi-word (hyphenated), e.g., `main-server`, `background-worker`, `admin-dashboard`
- Single-word names are discouraged as they're ambiguous and prone to conflicts
- Exception: `config` (singleton, always one per project)
- Helm charts can share names with the component they deploy (e.g., helm chart `admin-dashboard` deploys webapp `admin-dashboard`) - the `type` field distinguishes them

**Directory structure:**
- All components live at `components/<type-plural>/<name>/`
- Type directories are plural: `servers/`, `webapps/`, `helm_charts/`, `databases/`, `contracts/`
- Exception: `config` is a singleton at `components/config/` (not nested further)

**Clarifications:**
- `server_type` determines the communication pattern(s) and Operator lifecycle(s)
- A hybrid server supports multiple modes; `deploy_modes` on the helm chart determines which modes to actually deploy
- One server can have multiple helm charts with different `deploy_modes` (e.g., `main-server-api` for api-only, `main-server-hybrid` for api+worker)
- `deploy_modes` must be a subset of the server's `modes` array
- `provides_contracts` adds HTTP route handlers and a Kubernetes Service; a server can provide multiple contracts
- `consumes_contracts` generates API clients for calling other services; a server can consume contracts from any service
- All servers get health + metrics endpoints (port 9090) regardless of settings
- Business API runs on port 3000 when `provides_contracts` is non-empty
- Webapp config is injected into HTML at deploy time via ConfigMap
- Helm components are separate from the components they deploy - this allows flexibility (e.g., multiple helm charts for the same server with different deployment configurations)
- Webapp `contracts` is equivalent to server `consumes_contracts` - webapps only consume APIs, never provide them
- Server `provides_contracts` has no webapp equivalent - webapps don't expose server-side APIs

**Validation rules:**
- Helm charts can only deploy components with `helm: true` - if `helm: false`, the helm chart cannot be created
- When creating a helm chart, validation checks that the referenced component exists and has `helm: true`
- If a component has `helm: true`, there should be a corresponding helm chart (warning if missing)
- If a component has `helm: false`, there must not be a corresponding helm chart (error if exists)
- Helm chart `deploy_modes` must be a subset of the server's available modes (for hybrid: the `modes` array; for non-hybrid: the single `server_type` mode)
- Server `databases` must reference existing database components
- Server `provides_contracts` and `consumes_contracts` must reference existing contract components
- Webapp `contracts` must reference existing contract components

**Dependency graph:** All component relationships are explicit in settings:
- `server.databases[]` → database components
- `server.provides_contracts[]` → contract components (server implements)
- `server.consumes_contracts[]` → contract components (server calls)
- `webapp.contracts[]` → contract components
- `helm.deploys` → server or webapp component

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

### Component Directory Structure

Components are organized by type: `components/<type-plural>/<name>/`. Config is the exception (singleton at `components/config/`).

```
components/
├── servers/
│   ├── main-server/
│   └── background-worker/
├── webapps/
│   └── admin-dashboard/
├── helm_charts/
│   ├── main-server-api/       # Chart deploying main-server in api-only mode
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── deployment.yaml
│   │       ├── service.yaml
│   │       ├── ingress.yaml
│   │       └── servicemonitor.yaml
│   ├── main-server-hybrid/    # Chart deploying main-server in hybrid mode (api + worker)
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── deployment-api.yaml
│   │       ├── deployment-worker.yaml
│   │       ├── service.yaml
│   │       ├── ingress.yaml
│   │       └── servicemonitor.yaml
│   ├── background-worker/     # Chart deploying server "background-worker" (no ingress)
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── deployment.yaml
│   │       └── servicemonitor.yaml
│   ├── admin-dashboard/       # Chart deploying webapp "admin-dashboard"
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── deployment.yaml    # nginx serving static files
│   │       ├── service.yaml
│   │       ├── ingress.yaml
│   │       └── configmap.yaml     # Config injected into HTML
│   └── umbrella/              # Optional: installs all charts together
│       ├── Chart.yaml
│       └── values.yaml
├── databases/
│   └── primary-db/
├── contracts/
│   └── public-api/
└── config/                    # Exception: singleton, not nested further
    └── envs/
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
| `plugin/system/src/settings/sync-helm.ts` | **NEW** - Internal sync function for helm charts |
| `plugin/skills/helm-scaffolding/templates-webapp/` | **NEW** - Webapp Helm chart template |
| **Standards & Agents** | |
| `plugin/skills/helm-standards/SKILL.md` | Expand with settings patterns, observability |
| `plugin/agents/devops.md` | Add observability stack setup |
| **Settings Mutation** | |
| `plugin/commands/sdd-settings.md` | **NEW** - Command to view/change settings |
| `plugin/system/src/settings/sync.ts` | **NEW** - Internal function to propagate settings changes |

## Implementation

### Phase 1: Settings Type System

Define TypeScript types and JSON Schema for component settings.

**`plugin/system/src/types/settings.ts`:**
```typescript
export type ServerMode = 'api' | 'worker' | 'cron';
export type ServerType = ServerMode | 'hybrid';

export interface ServerSettings {
  readonly server_type: ServerType;
  readonly modes?: readonly ServerMode[];  // Required when server_type is 'hybrid' (2+ modes)
  readonly databases: readonly string[];   // Database components this server uses
  readonly provides_contracts: readonly string[];  // Contracts this server implements
  readonly consumes_contracts: readonly string[];  // Contracts this server calls
  readonly helm: boolean;                  // Whether this server needs a helm chart
}

export interface WebappSettings {
  readonly contracts: readonly string[];   // Contract components this webapp uses
  readonly helm: boolean;                  // Whether this webapp needs a helm chart
}

export type HelmAssets = 'bundled' | 'entrypoint';

// Helm chart settings for deploying a server
export interface HelmServerSettings {
  readonly deploys: string;           // Server component name
  readonly deploy_type: 'server';
  readonly deploy_modes?: readonly ServerMode[];  // Which modes to deploy (subset of server's modes)
  readonly ingress: boolean;
}

// Helm chart settings for deploying a webapp
export interface HelmWebappSettings {
  readonly deploys: string;           // Webapp component name
  readonly deploy_type: 'webapp';
  readonly ingress: boolean;
  readonly assets: HelmAssets;        // bundled = full app | entrypoint = index.html only
}

export type HelmSettings = HelmServerSettings | HelmWebappSettings;

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
  | { readonly type: 'helm'; readonly settings: HelmSettings }
  | { readonly type: 'database'; readonly settings: DatabaseSettings }
  | { readonly type: 'contract'; readonly settings: ContractSettings }
  | { readonly type: 'config'; readonly settings: Record<string, never> };

// Component with name and settings
export interface Component<S = ComponentSettings['settings']> {
  readonly name: string;
  readonly type: ComponentSettings['type'];
  readonly settings: S;
}
```

**`plugin/system/src/settings/defaults.ts`:**
```typescript
// Server defaults
export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  server_type: 'api',
  databases: [],
  provides_contracts: [],
  consumes_contracts: [],
  helm: true,
};

export const DEFAULT_WORKER_SETTINGS: ServerSettings = {
  server_type: 'worker',
  databases: [],
  provides_contracts: [],
  consumes_contracts: [],
  helm: true,
};

export const DEFAULT_HYBRID_SETTINGS: ServerSettings = {
  server_type: 'hybrid',
  modes: ['api', 'worker'],  // Default hybrid is api + worker
  databases: [],
  provides_contracts: [],
  consumes_contracts: [],
  helm: true,
};

// Webapp defaults
export const DEFAULT_WEBAPP_SETTINGS: WebappSettings = {
  contracts: [],
  helm: true,
};

// Helm defaults (deploys is always required, provided at creation time)
export const DEFAULT_HELM_SERVER_SETTINGS: Omit<HelmServerSettings, 'deploys'> = {
  deploy_type: 'server',
  ingress: true,
};

export const DEFAULT_HELM_WEBAPP_SETTINGS: Omit<HelmWebappSettings, 'deploys'> = {
  deploy_type: 'webapp',
  ingress: true,
  assets: 'bundled',
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
  // Always scaffold: operator, model/definitions
  await scaffoldCore(projectDir, component);

  // Conditional: HTTP routes (only if server provides contracts)
  if (settings.provides_contracts.length > 0) {
    await scaffoldRoutes(projectDir, component, settings.provides_contracts);
  }

  // Conditional: API clients (only if server consumes contracts)
  if (settings.consumes_contracts.length > 0) {
    await scaffoldApiClients(projectDir, component, settings.consumes_contracts);
  }

  // Conditional: DAL layer per database
  for (const db of settings.databases) {
    await scaffoldDAL(projectDir, component, db);
  }
};
```

### Phase 3: Settings-Driven Config Initialization

Update config scaffolding to generate initial config sections based on settings.

**Example: Server with `databases: [primary-db]`:**
```yaml
# components/config/envs/default/config.yaml
main-server:
  port: 3000
  databases:
    primary-db:                # Section per database in settings
      host: localhost
      port: 5432
      name: myapp
      ssl: false
```

**Example: Server with `databases: []`:**
```yaml
# components/config/envs/default/config.yaml
main-server:
  port: 3000
  # No databases section
```

**Example: Server with `consumes_contracts: [public-api]`:**
```yaml
# components/config/envs/default/config.yaml
background-worker:
  queue:                       # Worker connects to queue, not HTTP port
    url: amqp://localhost:5672
  apis:
    public-api:                # Section per consumed contract
      base_url: http://main-server:3000
```

### Phase 4: Helm Template System

Create Helm templates; scaffolding code selectively copies based on settings.

**Template library (all available templates):**
```
plugin/skills/helm-scaffolding/templates/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── deployment-api.yaml       # For hybrid: api mode
│   ├── deployment-worker.yaml    # For hybrid: worker mode
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── servicemonitor.yaml
│   ├── cronjob.yaml
│   └── configmap.yaml
```

Scaffolding code decides which templates to copy based on settings (see `scaffoldServerHelmChart` below).

**Scaffolding reads helm settings and the referenced component's settings:**
```typescript
const scaffoldHelmChart = async (
  projectDir: string,
  helmComponent: Component<HelmSettings>,
  allComponents: Component[]
): Promise<void> => {
  const helmSettings = helmComponent.settings;
  const helmDir = path.join(projectDir, 'components', 'helm_charts', helmComponent.name);

  // Find the component this chart deploys
  const deployedComponent = allComponents.find(
    c => c.name === helmSettings.deploys && c.type === helmSettings.deploy_type
  );
  if (!deployedComponent) {
    throw new Error(`Helm chart ${helmComponent.name} references unknown component: ${helmSettings.deploys}`);
  }

  // Validate that the deployed component has helm: true
  const deployedSettings = deployedComponent.settings as ServerSettings | WebappSettings;
  if (!deployedSettings.helm) {
    throw new Error(
      `Helm chart ${helmComponent.name} cannot deploy component ${helmSettings.deploys}: ` +
      `component has helm: false. Set helm: true on the ${helmSettings.deploy_type} to enable deployment.`
    );
  }

  if (helmSettings.deploy_type === 'server') {
    await scaffoldServerHelmChart(helmDir, helmSettings, deployedComponent.settings as ServerSettings);
  } else {
    await scaffoldWebappHelmChart(helmDir, helmSettings as HelmWebappSettings);
  }
};

const scaffoldServerHelmChart = async (
  helmDir: string,
  helmSettings: HelmServerSettings,
  serverSettings: ServerSettings
): Promise<void> => {
  // Validate deploy_modes is a subset of server's available modes
  const availableModes = serverSettings.server_type === 'hybrid'
    ? serverSettings.modes ?? []
    : [serverSettings.server_type];
  const deployModes = helmSettings.deploy_modes ?? availableModes;

  for (const mode of deployModes) {
    if (!availableModes.includes(mode)) {
      throw new Error(
        `Helm chart cannot deploy mode '${mode}': server only supports [${availableModes.join(', ')}]`
      );
    }
  }

  // Always copy base templates
  await copyTemplate('_helpers.tpl', helmDir);
  await copyTemplate('configmap.yaml', helmDir);
  await copyTemplate('servicemonitor.yaml', helmDir);  // All servers expose metrics

  // Deployment templates based on deploy_modes
  if (deployModes.length > 1) {
    // Multiple modes = separate deployments per mode
    if (deployModes.includes('api')) {
      await copyTemplate('deployment-api.yaml', helmDir);
    }
    if (deployModes.includes('worker')) {
      await copyTemplate('deployment-worker.yaml', helmDir);
    }
    if (deployModes.includes('cron')) {
      await copyTemplate('cronjob.yaml', helmDir);
    }
  } else if (deployModes[0] === 'cron') {
    await copyTemplate('cronjob.yaml', helmDir);
  } else {
    // Single mode (api or worker)
    await copyTemplate('deployment.yaml', helmDir);
  }

  // Service only if deploying api mode and server provides contracts
  if (deployModes.includes('api') && serverSettings.provides_contracts.length > 0) {
    await copyTemplate('service.yaml', helmDir);
  }

  // Ingress from helm settings
  if (helmSettings.ingress) {
    await copyTemplate('ingress.yaml', helmDir);
  }
};

const scaffoldWebappHelmChart = async (
  helmDir: string,
  helmSettings: HelmWebappSettings
): Promise<void> => {
  await copyTemplate('_helpers.tpl', helmDir);
  await copyTemplate('deployment.yaml', helmDir);  // nginx serving static files
  await copyTemplate('service.yaml', helmDir);
  await copyTemplate('configmap.yaml', helmDir);   // Config injected into HTML

  if (helmSettings.ingress) {
    await copyTemplate('ingress.yaml', helmDir);
  }

  // assets setting affects deployment.yaml content, not which templates to copy
};
```

### Phase 5: Helm Values Generation

Generate `values.yaml` based on settings.

**API server (ingress=true, provides_contracts non-empty):**
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

**Worker (ingress=false, provides_contracts empty):**
```yaml
replicaCount: 1
image:
  repository: {{CHART_NAME}}
  tag: latest

# No service section - worker has no provides_contracts
# No ingress section - worker doesn't need external access

observability:
  metrics:
    enabled: true
    port: 9090
    serviceMonitor:
      enabled: false
      interval: 30s
```

**Hybrid server (modes: [api, worker], independently scalable):**
```yaml
image:
  repository: {{CHART_NAME}}
  tag: latest

# Each mode in the hybrid gets its own deployment with independent scaling
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

# cron section would be here if modes included 'cron'

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
  {{#each helmComponents}}
  - name: {{name}}
    version: "0.1.0"
    repository: "file://../{{name}}"
  {{/each}}
```

### Phase 7: Sync System (Internal)

Internal functions for incremental scaffolding when settings change. These are called automatically by `/sdd-settings` after any setting modification - never invoked directly by users.

**`syncHelm` (internal):**
```typescript
export const syncHelm = async (projectDir: string): Promise<void> => {
  const settings = await loadSettings(projectDir);
  const allComponents = settings.components;

  // Find all helm components
  const helmComponents = allComponents.filter(c => c.type === 'helm');

  for (const helmComponent of helmComponents) {
    const helmDir = path.join(projectDir, 'components', 'helm_charts', helmComponent.name);
    if (!await exists(helmDir)) {
      await scaffoldHelmChart(projectDir, helmComponent, allComponents);
    } else {
      await syncHelmTemplates(helmDir, helmComponent.settings, allComponents);
    }
  }

  // Handle umbrella chart if multiple helm components exist
  if (helmComponents.length >= 2) {
    await syncUmbrellaChart(projectDir, helmComponents);
  }
};
```

**`syncSettings` (internal):**
Called after any settings modification. Propagates changes to all affected artifacts (config, helm, etc.). Determines what needs updating by comparing old vs new settings.

### Phase 8: Settings Command

Create `/sdd-settings` command for viewing and modifying settings.

**Usage:**
```
# View all component settings
/sdd-settings

# View specific component
/sdd-settings main-server

# Change a setting (interactive)
/sdd-settings main-server databases add reporting-db
```

**Workflow for setting changes:**

1. **Check working tree** - If uncommitted changes exist:
   ```
   You have uncommitted changes in:
   - components/servers/main-server/model/user.ts
   - components/config/envs/default/config.yaml

   Settings changes may modify these files. Options:
   [1] Auto-commit current changes (recommended)
   [2] Continue without committing (risky)
   [3] Cancel
   ```
   Auto-commit uses message: `WIP: Auto-save before settings change`
   (No changelog entry - this is a safety checkpoint, not a release)

2. **Validate** - Verify the change is valid (e.g., referenced component exists)

3. **Preview** - Explain what will happen:
   ```
   Adding database 'reporting-db' to main-server will:
   - Add DAL layer for reporting-db in components/servers/main-server/dal/
   - Add database config section in components/config/envs/*/config.yaml
   - Update helm chart values with new DB connection

   Proceed? [y/n]
   ```

4. **Apply** - Update sdd-settings.yaml

5. **Sync** - Automatically scaffold/update affected artifacts

6. **Report** - Show what was created/modified

**Key principles:**
- Settings changes always trigger automatic sync - users never manually run sync
- Uncommitted work is protected via auto-commit checkpoint before any file modifications

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

2. **Helm flag validation**
   - Helm charts can only reference components with `helm: true`
   - Creating a helm chart for a component with `helm: false` throws an error
   - Components with `helm: true` should have a corresponding helm chart (warning if missing)
   - Components with `helm: false` must not have a helm chart (error if exists)

3. **Scaffolding correctness**
   - Server with `databases: [primary-db]` gets DAL layer for that database
   - Helm chart with `ingress: false` gets no ingress.yaml
   - Servers with empty `provides_contracts` get no Service in their helm chart
   - Components with `helm: false` skip helm chart scaffolding

4. **Config initialization**
   - Initial config reflects settings
   - Database sections generated per entry in `databases[]`

5. **Sync correctness**
   - Adding `ingress: true` to existing server adds ingress.yaml
   - Sync never deletes user-modified content
   - Changing `helm: false` to `helm: true` triggers helm chart scaffolding

6. **Helm template rendering**
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
