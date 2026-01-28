# Project: {{PROJECT_NAME}}

## Tech Stack

- **API Contract:** OpenAPI 3.x (path depends on contract component name in `sdd-settings.yaml`)
- **Backend:** Node.js 20, TypeScript 5, Express (CMDO architecture)
- **Frontend:** React 18, TypeScript 5, Vite (MVVM architecture)
- **Database:** PostgreSQL 15
- **Testing:** Vitest (unit), Testkube (integration/E2E)
- **Deployment:** Kubernetes, Helm

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| Config | `config/` | Environment configuration (project root, not a component) |
| Contract | `components/{name}/` | OpenAPI spec, type generation |
| Server | `components/{name}/` | Backend (CMDO architecture) |
| Webapp | `components/{name}/` | React frontend (MVVM) |
| Helm | `components/{name}/` | Kubernetes deployment |
| Testing | `components/{name}/` | Testkube test definitions |

Note: Component directory names are determined by `{type, name}` in `sdd-settings.yaml`. The directory is `components/{type}/` when name equals type, or `components/{type}-{name}/` when they differ (e.g., `components/contract-task-api/`, `components/server-admin/`).

## Backend Architecture (CMDO)

**C**ontroller **M**odel **D**AL **O**perator - strict separation of concerns:

```
Operator → Controller → Model Use Cases
   ↓            ↓              ↑
Config → [All layers] → Dependencies
                              ↓
                            DAL
```

## Spec-Driven Development

1. **Specs are truth:** Every change needs a SPEC.md
2. **Change types:** Changes can be `feature`, `bugfix`, or `refactor`
3. **Issue required:** Every spec references a tracking issue
4. **Git = state machine:** PR = draft, merged = active

## Key Paths

| Path | Purpose |
|------|---------|
| `specs/INDEX.md` | Registry of all specs |
| `specs/changes/` | Change specifications (features, bugfixes, refactors) |
| `components/{contract-component}/openapi.yaml` | API contract (path depends on component name) |
| `sdd-settings.yaml` | Project settings (components, domains) |

## Claude Code Commands

- `/sdd-init --name [name]` - Initialize new project
- `/sdd-new-change --type [type] --name [name]` - Start new change
- `/sdd-implement-change [change-dir]` - Implement plan
- `/sdd-verify-change [change-dir]` - Verify implementation
