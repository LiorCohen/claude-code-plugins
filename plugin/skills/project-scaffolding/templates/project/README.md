# {{PROJECT_NAME}}

Brief description of the project.

## Quick Start

```bash
# Install all dependencies
npm install --workspaces

# Generate types from API contract (path depends on contract component name in sdd-settings.yaml)
cd components/<contract-component> && npm run generate:types

# Start local Kubernetes cluster
minikube start

# Deploy locally (path depends on helm component name in sdd-settings.yaml)
helm upgrade --install {{PROJECT_NAME}} ./components/<helm-component>/{{PROJECT_NAME}} -f ./components/<helm-component>/{{PROJECT_NAME}}/values-local.yaml

# Or run in development mode (paths depend on component names in sdd-settings.yaml)
cd components/<server-component> && npm run dev
cd components/<webapp-component> && npm run dev
```

## Project Structure

```
├── specs/                          # Product specifications
├── config/                         # Environment configuration
├── components/                     # Component directories (names from sdd-settings.yaml)
│   ├── <contract-component>/       # API contracts (OpenAPI)
│   ├── <server-component>/         # Node.js/TypeScript backend
│   ├── <webapp-component>/         # React/TypeScript frontend
│   ├── <helm-component>/           # Kubernetes deployment
│   └── <testing-component>/        # Testkube test definitions
└── e2e/                            # E2E test source code
```

## Spec-Driven Development

1. **Specs are truth** - Every change has a spec before code
2. **Change types** - Changes can be `feature`, `bugfix`, or `refactor`
3. **Issue required** - Every spec must reference a tracking issue
4. **Git is the state machine** - In PR = draft, merged = active
5. **Current state** - See `specs/SNAPSHOT.md` or `specs/INDEX.md`

## Claude Code Commands

| Command | Purpose |
|---------|---------|
| `/sdd-init --name [name]` | Initialize new project |
| `/sdd-new-change --type [type] --name [name]` | Start new change (feature, bugfix, refactor) |
| `/sdd-implement-change [change-dir]` | Implement a plan |
| `/sdd-verify-change [change-dir]` | Verify implementation |

## Tech Stack

- **API Contract:** OpenAPI 3.x
- **Backend:** Node.js 20, TypeScript 5, Express
- **Frontend:** React 18, TypeScript 5, Vite
- **Database:** PostgreSQL 15
- **Testing:** Vitest (unit), Testkube (integration/E2E)
- **Deployment:** Kubernetes, Helm
- **Observability:** OpenTelemetry

## Development

### Running Locally

```bash
# Backend (path depends on server component name in sdd-settings.yaml)
cd components/<server-component>
npm run dev

# Frontend (path depends on webapp component name in sdd-settings.yaml)
cd components/<webapp-component>
npm run dev
```

### Running Tests

```bash
# Unit tests
npm test --workspaces

# Integration tests (requires Kubernetes)
testkube run testsuite integration-tests --watch

# E2E tests (requires Kubernetes)
testkube run testsuite e2e-tests --watch
```

## License

MIT
