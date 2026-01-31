---
name: backend-scaffolding
description: Scaffolds Node.js/TypeScript backend components with CMDO architecture.
---

# Backend Scaffolding Skill

Creates a Node.js/TypeScript backend component following the CMDO (Config, Model, DAL, Operator) architecture.

## When to Use

This skill is called by the main `scaffolding` skill when creating server components. It can create multiple named instances (e.g., `server-api`, `server-worker`).

## What It Creates

```
components/<server-name>/
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
    │   ├── create_database.ts      # PostgreSQL database setup
    │   ├── create_http_server.ts   # HTTP server setup
    │   ├── lifecycle_probes.ts     # Health/ready endpoints
    │   ├── logger.ts               # Structured logging
    │   ├── metrics.ts              # Metrics collection
    │   └── state_machine.ts        # Lifecycle state machine
    ├── controller/
    │   ├── index.ts
    │   ├── create_controller.ts    # Controller factory
    │   └── http_handlers/
    │       └── index.ts            # Empty barrel (add handlers as features are implemented)
    ├── model/
    │   ├── index.ts
    │   ├── dependencies.ts         # Dependency injection interface
    │   ├── definitions/
    │   │   └── index.ts            # Empty barrel (add types as entities are defined)
    │   └── use-cases/
    │       └── index.ts            # Empty barrel (add use cases as features are implemented)
    └── dal/
        └── index.ts                # Empty barrel (add DAL functions as features are implemented)
```

## CMDO Architecture

| Layer | Purpose | Location |
|-------|---------|----------|
| **C**onfig | Configuration loading and validation | `src/config/` |
| **M**odel | Business logic, definitions, use cases | `src/model/` |
| **D**AL | Data Access Layer, database operations | `src/dal/` |
| **O**perator | Application lifecycle, servers, telemetry | `src/operator/` |

Plus **Controller** for HTTP request handling.

## Multiple Instances

Supports multiple named backend instances:

| Input | Directory Created |
|-------|-------------------|
| `server` | `components/server/` |
| `server:api` | `components/server-api/` |
| `server:worker` | `components/server-worker/` |

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name |
| `{{PROJECT_DESCRIPTION}}` | Project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |

## Usage

Called programmatically by the scaffolding script:

```python
from backend_scaffolding import scaffold_backend

scaffold_backend(
    target_dir="/path/to/project",
    component_name="api",           # Creates server-api/
    project_name="my-app",
)
```

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

## Config Schema

When scaffolding a server component, the following config section is added to `components/config/`:

### Minimal Config (envs/default/config.yaml)

```yaml
server-{name}:
  port: 3000
  probesPort: 9090
  logLevel: info
```

### TypeScript Type (types/server.ts)

```typescript
export type ServerConfig = Readonly<{
  port: number;
  probesPort: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}>;
```

### JSON Schema (schemas/config.schema.json)

```json
{
  "server-{name}": {
    "type": "object",
    "properties": {
      "port": { "type": "number", "default": 3000 },
      "probesPort": { "type": "number", "default": 9090 },
      "logLevel": { "enum": ["debug", "info", "warn", "error"], "default": "info" }
    },
    "required": ["port", "probesPort", "logLevel"]
  }
}
```

### Optional Extensions

Features may extend the config as needed:

```yaml
server-{name}:
  port: 3000
  probesPort: 9090
  logLevel: info
  database:
    host: localhost
    port: 5432
    name: appdb
    user: app
    passwordSecret: db-credentials
    pool: 10
```

---

## Related Skills

- `backend-standards` - Coding standards for backend development
- `typescript-standards` - TypeScript coding conventions
- `unit-testing` - Unit testing patterns for backend code
