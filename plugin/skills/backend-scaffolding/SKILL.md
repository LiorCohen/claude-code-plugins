---
name: backend-scaffolding
description: Scaffolds Node.js/TypeScript backend components with CMDO architecture, driven by component settings.
---

# Backend Scaffolding Skill

Creates a Node.js/TypeScript backend component following the CMDO (Config, Model, DAL, Operator) architecture. Scaffolding is driven by **component settings** defined in `.sdd/sdd-settings.yaml`.

## When to Use

This skill is called by the main `scaffolding` skill when creating server components. It can create multiple named instances (e.g., `main-server`, `background-worker`).

## Settings-Driven Scaffolding

Server components are scaffolded based on their settings in `.sdd/sdd-settings.yaml`:

```yaml
components:
  - name: main-server
    type: server
    settings:
      server_type: api           # api | worker | cron | hybrid
      databases: [primary-db]    # Database components this server uses
      provides_contracts: [public-api]  # Contracts this server implements
      consumes_contracts: []     # Contracts this server calls
      helm: true                 # Whether this server needs a helm chart
```

### Settings Impact on Scaffolding

| Setting | Impact |
|---------|--------|
| `server_type: api` | Scaffolds HTTP server lifecycle in Operator |
| `server_type: worker` | Scaffolds queue consumer lifecycle in Operator |
| `server_type: cron` | Scaffolds scheduler lifecycle in Operator |
| `server_type: hybrid` | Scaffolds multiple lifecycles based on `modes` |
| `databases: [...]` | Scaffolds DAL layer per database, adds DB config section |
| `provides_contracts: [...]` | Scaffolds HTTP route handlers per contract |
| `consumes_contracts: [...]` | Generates API clients for calling other services |
| `helm: false` | Skips helm chart scaffolding for this server |

### Conditional Scaffolding Logic

```typescript
// Pseudocode for settings-driven scaffolding
const scaffoldServer = async (component: ServerComponent): Promise<void> => {
  // Always scaffold: core structure, operator lifecycle, model layer
  await scaffoldCore(component);

  // Conditional: HTTP routes (only if server provides contracts)
  if (component.settings.provides_contracts.length > 0) {
    await scaffoldRoutes(component, component.settings.provides_contracts);
  }

  // Conditional: API clients (only if server consumes contracts)
  if (component.settings.consumes_contracts.length > 0) {
    await scaffoldApiClients(component, component.settings.consumes_contracts);
  }

  // Conditional: DAL layer per database
  for (const db of component.settings.databases) {
    await scaffoldDAL(component, db);
  }
};
```

## What It Creates

### Base Structure (Always Created)

```
components/servers/<name>/
├── package.json
├── tsconfig.json
├── .gitignore
└── src/
    ├── index.ts                    # Entry point
    ├── config/
    │   ├── index.ts
    │   └── load_config.ts          # Config loading
    ├── operator/
    │   ├── index.ts
    │   ├── create_operator.ts      # Operator factory
    │   ├── lifecycle_probes.ts     # Health/ready endpoints (port 9090)
    │   ├── logger.ts               # Structured logging
    │   ├── metrics.ts              # Metrics collection
    │   └── state_machine.ts        # Lifecycle state machine
    ├── controller/
    │   ├── index.ts
    │   └── create_controller.ts    # Controller factory
    └── model/
        ├── index.ts
        ├── dependencies.ts         # Dependency injection interface
        ├── definitions/
        │   └── index.ts            # Empty barrel
        └── use-cases/
            └── index.ts            # Empty barrel
```

### Conditional: HTTP Server (when `server_type` includes `api`)

```
└── src/
    └── operator/
        └── create_http_server.ts   # HTTP server setup (port 3000)
```

### Conditional: HTTP Handlers (when `provides_contracts` is non-empty)

```
└── src/
    └── controller/
        └── http_handlers/
            └── index.ts            # Route handlers for contracts
```

### Conditional: DAL Layer (when `databases` is non-empty)

For each database in `databases`, creates:

```
└── src/
    └── dal/
        └── <database-name>/
            └── index.ts            # DAL functions for this database
    └── operator/
        └── create_database_<name>.ts  # Database connection setup
```

### Conditional: API Clients (when `consumes_contracts` is non-empty)

For each contract in `consumes_contracts`, generates API client from contract spec.

## CMDO Architecture

| Layer | Purpose | Location |
|-------|---------|----------|
| **C**onfig | Configuration loading and validation | `src/config/` |
| **M**odel | Business logic, definitions, use cases | `src/model/` |
| **D**AL | Data Access Layer, database operations | `src/dal/` |
| **O**perator | Application lifecycle, servers, telemetry | `src/operator/` |

Plus **Controller** for HTTP request handling.

## Directory Structure

Servers live at `components/servers/<name>/`:

| Component Name | Directory |
|----------------|-----------|
| `main-server` | `components/servers/main-server/` |
| `background-worker` | `components/servers/background-worker/` |

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name |
| `{{PROJECT_DESCRIPTION}}` | Project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |
| `{{SERVER_NAME}}` | Server component name |

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```
skills/backend-scaffolding/templates/
├── package.json
├── tsconfig.json
├── .gitignore
└── src/
    ├── index.ts
    ├── config/
    ├── operator/
    ├── controller/
    ├── model/
    └── dal/
```

## Config Integration

When scaffolding a server component, the config section is generated based on settings.

### Example: API Server with Database

Settings:
```yaml
- name: main-server
  type: server
  settings:
    server_type: api
    databases: [primary-db]
    provides_contracts: [public-api]
```

Generated config (`components/config/envs/default/config.yaml`):
```yaml
main-server:
  port: 3000
  probesPort: 9090
  logLevel: info
  databases:
    primary-db:
      host: localhost
      port: 5432
      name: myapp
      ssl: false
```

### Example: Worker without Database

Settings:
```yaml
- name: background-worker
  type: server
  settings:
    server_type: worker
    databases: []
    provides_contracts: []
    consumes_contracts: [public-api]
```

Generated config:
```yaml
background-worker:
  probesPort: 9090
  logLevel: info
  queue:
    url: amqp://localhost:5672
  apis:
    public-api:
      base_url: http://main-server:3000
```

---

## Related Skills

- `backend-standards` - Coding standards for backend development
- `typescript-standards` - TypeScript coding conventions
- `unit-testing` - Unit testing patterns for backend code
- `config-scaffolding` - Creates the config component
- `helm-scaffolding` - Creates Helm charts for deployment
