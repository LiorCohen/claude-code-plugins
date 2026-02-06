---
name: contract-scaffolding
description: Scaffolds OpenAPI contract component with type generation.
user-invocable: false
---

# Contract Scaffolding Skill

Creates an OpenAPI contract component that defines the API specification and generates TypeScript types for use by server and webapp components.

## When to Use

This skill is called by the main `scaffolding` skill when creating a contract component. Contract components support multiple instances (e.g., `contracts/customer-api/`, `contracts/back-office-api/`).

## What It Creates

The directory path is `components/contracts/{name}/` based on the component name in `.sdd/sdd-settings.yaml`.

```
components/contracts/{name}/
├── package.json          # Build scripts (call sdd-system CLI)
├── openapi.yaml          # OpenAPI 3.0 specification
├── .gitignore            # Ignores generated/ directory
└── generated/            # Generated types (git-ignored)
    └── api-types.ts      # Generated after npm run generate:types
```

## OpenAPI Template

The template `openapi.yaml` includes:

- Basic info section with project name and description
- Placeholder for paths (add endpoints as features are implemented)
- Reusable Error schema and standard error responses

Note: Health check endpoints (`/health`, `/readiness`, `/liveness`) are NOT defined in the OpenAPI spec. They are infrastructure endpoints implemented directly in the controller.

## Type Generation

The contract component generates TypeScript types from the OpenAPI spec:

```bash
cd components/contract  # path depends on component name
npm run generate:types
npm run validate        # Validate OpenAPI spec with Spectral
```

Or use the CLI directly:

```bash
sdd-system contract generate-types <component-name>
sdd-system contract validate <component-name>
```

This creates `generated/api-types.ts` inside the contract component. The contract is published as a workspace package — server and webapp components consume types by declaring a workspace dependency and importing:

```typescript
import type { components } from '@project-name/contract';

type Greeting = components['schemas']['Greeting'];
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name (used in API info) |
| `{{PROJECT_DESCRIPTION}}` | API description |

## Usage

Called programmatically by the scaffolding system during project creation via `sdd-system scaffolding project`.

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```
skills/components/contract/contract-scaffolding/templates/
├── package.json
└── openapi.yaml
```

## Related Skills

- `api-design` - API design patterns and conventions
- `typescript-standards` - TypeScript coding conventions

## Integration with Other Components

```
                    ┌─────────────────┐
                    │    contract/    │
                    │  openapi.yaml   │
                    └────────┬────────┘
                             │
                    npm run generate:types
                             │
                    ┌────────▼────────┐
                    │   generated/    │
                    │    types.ts     │
                    │ (workspace pkg) │
                    └────────┬────────┘
                             │
              import type from '@project/contract'
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌───────────▼───────────┐
    │      server/      │       │        webapp/        │
    │  "workspace:*"    │       │    "workspace:*"      │
    └───────────────────┘       └───────────────────────┘
```
