# Project: {{PROJECT_NAME}}

## Tech Stack

- **API Contract:** OpenAPI 3.x in `components/contract/`
- **Backend:** Node.js 20, TypeScript 5, Express (5-layer architecture)
- **Frontend:** React 18, TypeScript 5, Vite
- **Database:** PostgreSQL 15
- **Testing:** Vitest (unit), Testkube (integration/E2E)
- **Deployment:** Kubernetes, Helm

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| Contract | `components/contract/` | OpenAPI spec, type generation |
| Server | `components/server/` | Backend (5-layer architecture) |
| Webapp | `components/webapp/` | React frontend |
| Helm | `components/helm/` | Kubernetes deployment |
| Testing | `components/testing/` | Testkube test definitions |

## Backend Architecture (5 Layers)

```
Server → Controller → Model Use Cases
   ↓         ↓            ↑
Config → [All layers] → Dependencies
                           ↓
                         DAL
```

## Spec-Driven Development

1. **Specs are truth:** Every feature needs a SPEC.md
2. **Issue required:** Every spec references a tracking issue
3. **Git = state machine:** PR = draft, merged = active

## Key Paths

| Path | Purpose |
|------|---------|
| `specs/INDEX.md` | Registry of all specs |
| `specs/features/` | Feature specifications |
| `components/contract/openapi.yaml` | API contract |

## Claude Code Commands

- `/project:init` - Initialize new project
- `/project:new-feature` - Start new feature
- `/project:implement-spec` - Implement spec
- `/project:verify-spec` - Verify implementation
- `/project:generate-snapshot` - Regenerate snapshot
