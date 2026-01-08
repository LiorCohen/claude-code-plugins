# {{PROJECT_NAME}}

Brief description of the project.

## Quick Start

```bash
# Install all dependencies
npm install --workspaces

# Generate types from API contract
cd components/contract && npm run generate:types

# Start local Kubernetes cluster
minikube start

# Deploy locally
helm upgrade --install {{PROJECT_NAME}} ./components/helm/{{PROJECT_NAME}} -f ./components/helm/{{PROJECT_NAME}}/values-local.yaml

# Or run in development mode
cd components/server && npm run dev
cd components/webapp && npm run dev
```

## Project Structure

```
├── specs/                          # Product specifications
├── components/
│   ├── contract/                   # API contracts (OpenAPI)
│   ├── server/                     # Node.js/TypeScript backend
│   ├── webapp/                     # React/TypeScript frontend
│   ├── helm/                       # Kubernetes deployment
│   └── testing/                    # Testkube test definitions
└── e2e/                            # E2E test source code
```

## Spec-Driven Development

1. **Specs are truth** - Every feature has a spec before code
2. **Issue required** - Every spec must reference a tracking issue
3. **Git is the state machine** - In PR = draft, merged = active
4. **Current state** - See `specs/SNAPSHOT.md` or `specs/INDEX.md`

## Claude Code Commands

| Command | Purpose |
|---------|---------|
| `/project:init [name]` | Initialize new project |
| `/project:new-feature [name]` | Start new feature |
| `/project:implement-spec [path]` | Implement a spec |
| `/project:verify-spec [path]` | Verify implementation |
| `/project:generate-snapshot` | Regenerate snapshot |

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
# Backend
cd components/server
npm run dev

# Frontend
cd components/webapp
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
