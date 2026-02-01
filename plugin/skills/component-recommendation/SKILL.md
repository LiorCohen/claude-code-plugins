---
name: component-recommendation
description: Recommend and configure technical components with settings based on product requirements.
---

# Component Recommendation Skill

Maps product requirements to technical architecture, recommending appropriate components with their settings and handling user adjustments.

## Purpose

Based on product discovery results:
- Recommend appropriate technical components with settings
- Validate component dependencies and settings
- Handle multiple component instances (e.g., multiple servers or webapps)
- Return final component configuration including settings

## When to Use

- During `/sdd-init` after product discovery
- When adding new components to an existing project
- For architecture discussions

## Input

Receives discovery results from the `product-discovery` skill:

```yaml
discovery_results:
  product_description: "Task management for engineering teams"
  primary_domain: "Task Management"
  user_personas:
    - type: "Project Manager"
      actions: "create projects, assign tasks"
    - type: "Team Member"
      actions: "update progress"
  core_workflows:
    - "Create projects"
    - "Assign tasks"
  domain_entities: ["Team", "Project", "Task"]
  integrations: ["Slack"]
  constraints: []
  scope: "mvp"
```

## Output

Components now include `settings` based on their type:

```yaml
project_type: "fullstack"
components:
  # === CONFIG (mandatory singleton) ===
  - name: config
    type: config
    settings: {}

  # === CONTRACT ===
  - name: task-api
    type: contract
    settings:
      visibility: internal       # public | internal

  # === DATABASE ===
  - name: task-db
    type: database
    settings:
      provider: postgresql
      dedicated: false

  # === SERVER ===
  - name: task-server
    type: server
    settings:
      server_type: api           # api | worker | cron | hybrid
      databases: [task-db]       # Database components this server uses
      provides_contracts: [task-api]  # Contracts this server implements
      consumes_contracts: []     # Contracts this server calls
      helm: true

  # === WEBAPP ===
  - name: task-dashboard
    type: webapp
    settings:
      contracts: [task-api]      # Contracts this webapp uses
      helm: true

  # === HELM (one per deployment configuration) ===
  - name: task-server-api
    type: helm
    settings:
      deploys: task-server       # Server/webapp component to deploy
      deploy_type: server        # server | webapp
      deploy_modes: [api]        # For servers: which modes
      ingress: true

  - name: task-dashboard-web
    type: helm
    settings:
      deploys: task-dashboard
      deploy_type: webapp
      ingress: true
      assets: bundled            # bundled | entrypoint

  # === TESTING ===
  - name: task-tests
    type: testing

  # === CICD ===
  - name: task-ci
    type: cicd
```

## Component Settings

### Server Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `server_type` | `api\|worker\|cron\|hybrid` | `api` | Communication pattern(s) |
| `modes` | `(api\|worker\|cron)[]` | — | For hybrid: 2+ modes |
| `databases` | string[] | `[]` | Database components used |
| `provides_contracts` | string[] | `[]` | Contracts implemented |
| `consumes_contracts` | string[] | `[]` | Contracts called |
| `helm` | boolean | `true` | Generate helm chart |

### Webapp Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `contracts` | string[] | `[]` | Contracts used |
| `helm` | boolean | `true` | Generate helm chart |

### Helm Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `deploys` | string | — | Component to deploy (required) |
| `deploy_type` | `server\|webapp` | — | Type being deployed (required) |
| `deploy_modes` | `(api\|worker\|cron)[]` | — | For servers: which modes |
| `ingress` | boolean | `true` | External HTTP access |
| `assets` | `bundled\|entrypoint` | `bundled` | For webapps only |

### Database Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `provider` | `postgresql` | `postgresql` | Database provider |
| `dedicated` | boolean | `false` | Needs own DB server |

### Contract Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `visibility` | `public\|internal` | `internal` | External consumers allowed |

## Available Components

| Component | Description | Scaffolding Skill | Multi-Instance |
|-----------|-------------|-------------------|----------------|
| `config` | YAML configuration (MANDATORY) | `config-scaffolding` | No (singleton) |
| `contract` | OpenAPI specification | `contract-scaffolding` | Yes |
| `server` | Node.js backend (CMDO pattern) | `backend-scaffolding` | Yes |
| `webapp` | React frontend (MVVM pattern) | `frontend-scaffolding` | Yes |
| `database` | PostgreSQL migrations/seeds | `database-scaffolding` | Yes |
| `helm` | Kubernetes Helm charts | `helm-scaffolding` | Yes |
| `testing` | Testkube test setup | (inline) | Yes |
| `cicd` | GitHub Actions workflows | (inline) | Yes |

## Workflow

### Step 1: Analyze Requirements

Map discovered information to technical needs:

| Discovery Element | Technical Implication | Settings Impact |
|-------------------|----------------------|-----------------|
| Multiple user types with different UIs | Consider separate webapps | Each webapp has `contracts` |
| Data persistence mentioned | Database component | Server has `databases` |
| Background processing | Worker server | `server_type: worker` or `hybrid` |
| Scheduled jobs | Cron server | `server_type: cron` or `hybrid` |
| API/backend workflows | Server with contract | `provides_contracts` |
| Calling external APIs | | `consumes_contracts` |
| External HTTP access | Ingress needed | `ingress: true` |
| Internal service only | No ingress | `ingress: false` |

### Step 2: Present Recommendation with Settings

```
Based on what you've described, I recommend:

**Components:**
- **Backend API Server** - to handle <workflows>
  - Provides: task-api contract
  - Uses: task-db database
  - Mode: API server with HTTP ingress

- **Web Frontend** - for <user types>
  - Consumes: task-api contract
  - Deployment: Bundled assets with ingress

- **Database** - to persist <entities>
  - PostgreSQL (shared in local dev)

[Additional components with justification]

Does this match what you had in mind?
```

### Step 3: Handle Adjustments

If user wants changes, update both components and settings:

1. **Adding database to server**: Add to `databases` array
2. **Adding contract**: Ask if provides or consumes
3. **Enabling background processing**: Change `server_type` to `hybrid`, add `worker` to `modes`
4. **Disabling ingress**: Set `ingress: false` on helm chart

### Step 4: Multiple Component Instances

**For Server (if multiple processing needs):**

```
Should the backend be a single service or multiple?
- Single API server
- API + Worker (hybrid mode in one deployment)
- Separate API and Worker servers (independent scaling)
```

If hybrid: One server with `server_type: hybrid`, `modes: [api, worker]`
If separate: Two servers, potentially two helm charts with different `deploy_modes`

**For Helm (multiple deployment configurations):**

A single server can have multiple helm charts:
- `main-server-api` with `deploy_modes: [api]` and `ingress: true`
- `main-server-worker` with `deploy_modes: [worker]` and `ingress: false`

This allows independent scaling of API and worker processes.

### Step 5: Settings Validation

Before returning, validate:

1. **Database references**: Each server's `databases` must reference existing database components
2. **Contract references**: `provides_contracts`, `consumes_contracts`, and `contracts` must reference existing contract components
3. **Helm references**: `deploys` must reference a component with `helm: true`
4. **Hybrid modes**: If `server_type: hybrid`, `modes` must have 2+ entries
5. **Deploy modes**: Helm `deploy_modes` must be subset of server's available modes

### Step 6: Return Configuration

Return the final configuration with all settings.

## Examples

### Example 1: Standard Full-Stack

```yaml
project_type: "fullstack"
components:
  - name: config
    type: config
    settings: {}
  - name: public-api
    type: contract
    settings:
      visibility: internal
  - name: app-db
    type: database
    settings:
      provider: postgresql
      dedicated: false
  - name: main-server
    type: server
    settings:
      server_type: api
      databases: [app-db]
      provides_contracts: [public-api]
      consumes_contracts: []
      helm: true
  - name: web-app
    type: webapp
    settings:
      contracts: [public-api]
      helm: true
  - name: main-server-api
    type: helm
    settings:
      deploys: main-server
      deploy_type: server
      deploy_modes: [api]
      ingress: true
  - name: web-app-chart
    type: helm
    settings:
      deploys: web-app
      deploy_type: webapp
      ingress: true
      assets: bundled
```

### Example 2: Microservices with Hybrid Server

```yaml
project_type: "custom"
components:
  - name: config
    type: config
    settings: {}
  - name: orders-api
    type: contract
    settings:
      visibility: internal
  - name: notifications-api
    type: contract
    settings:
      visibility: internal
  - name: orders-db
    type: database
    settings:
      provider: postgresql
      dedicated: false
  - name: order-service
    type: server
    settings:
      server_type: hybrid
      modes: [api, worker]
      databases: [orders-db]
      provides_contracts: [orders-api]
      consumes_contracts: [notifications-api]
      helm: true
  - name: notification-service
    type: server
    settings:
      server_type: worker
      databases: []
      provides_contracts: [notifications-api]
      consumes_contracts: []
      helm: true
  # Separate helm charts for independent scaling
  - name: order-service-api
    type: helm
    settings:
      deploys: order-service
      deploy_type: server
      deploy_modes: [api]
      ingress: true
  - name: order-service-worker
    type: helm
    settings:
      deploys: order-service
      deploy_type: server
      deploy_modes: [worker]
      ingress: false
  - name: notification-service-chart
    type: helm
    settings:
      deploys: notification-service
      deploy_type: server
      ingress: false
```

## Notes

- This skill is conversational and handles user interaction for adjustments
- It does not create any files
- The output is used by `project-settings` and `scaffolding` skills
- Always validate settings dependencies before accepting the final configuration
- **Config is MANDATORY**: Always include `{type: config, name: config, settings: {}}` first
- Settings drive what gets scaffolded - they are not just metadata
