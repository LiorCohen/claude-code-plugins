# Spec-Driven Development Plugin

A comprehensive Claude Code plugin for spec-driven development methodology with React, Node.js, and TypeScript.

## Overview

This plugin implements a complete workflow where **specifications are the source of truth**. Every feature, abstraction, and domain concept lives in markdown specifications before it lives in code.

```
Specs → Plans → Implementation → Tests → Validation
  ↑                                           |
  └───────────── Feedback Loop ───────────────┘
```

## Features

- **10 Specialized Agents**: From spec writing to code review
- **5-Layer Backend Architecture**: Strict separation of concerns
- **Contract-First API Design**: OpenAPI-driven type generation
- **Kubernetes-Native**: Helm charts and Testkube integration
- **OpenTelemetry**: Full observability from day one
- **Immutable & Type-Safe**: Strict TypeScript, readonly everywhere

## Quick Start

1. **Install the plugin** (if using Claude Code plugin system):
   ```bash
   claude-code plugin install /path/to/sdd
   ```

2. **Initialize a new project**:
   ```
   /project:init my-app
   ```

3. **Create your first feature**:
   ```
   /project:new-feature user-authentication
   ```

## Components

| Component | Purpose |
|-----------|---------|
| **Agents** | 10 specialized agents for different roles |
| **Skills** | Reusable patterns and templates |
| **Commands** | Project lifecycle automation |
| **Templates** | Project scaffolding files |
| **Scripts** | Validation and generation utilities |

## Key Principles

1. **Specs are truth** - Every feature needs a SPEC.md before code
2. **Issue required** - Every spec references a tracking issue
3. **Git = state machine** - PR = draft, merged = active
4. **Contract-first** - OpenAPI drives both frontend and backend types
5. **Test in Kubernetes** - Testkube for environment parity
6. **Observable by default** - OpenTelemetry for all services

## Directory Structure

```
your-project/
├── specs/
│   ├── INDEX.md                   # Registry of all specs
│   ├── SNAPSHOT.md                # Current product state
│   ├── domain/
│   ├── features/
│   └── plans/
├── components/
│   ├── contract/                  # OpenAPI specs
│   ├── server/                    # Node.js backend
│   ├── webapp/                    # React frontend
│   ├── helm/                      # Kubernetes deployment
│   └── testing/                   # Testkube tests
└── .github/workflows/             # CI/CD
```

## Agents

| Agent | Role | Model |
|-------|------|-------|
| `spec-writer` | Create/maintain specifications | opus |
| `planner` | Break specs into implementation phases | opus |
| `api-designer` | Design OpenAPI contracts | sonnet |
| `frontend-dev` | React components | sonnet |
| `backend-dev` | 5-layer backend architecture | sonnet |
| `db-advisor` | Database performance review | opus |
| `devops` | Kubernetes, Helm, Testkube | sonnet |
| `ci-dev` | CI/CD pipelines | sonnet |
| `tester` | Test automation via Testkube | sonnet |
| `reviewer` | Code review, spec compliance | opus |

## Commands

- `/project:init [name]` - Initialize new project
- `/project:new-feature [name]` - Start new feature
- `/project:implement-spec [path]` - Implement a spec
- `/project:verify-spec [path]` - Verify implementation
- `/project:generate-snapshot` - Regenerate snapshot

## Tech Stack

- **API Contract:** OpenAPI 3.x
- **Backend:** Node.js 20, TypeScript 5, Express
- **Frontend:** React 18, TypeScript 5, Vite
- **Database:** PostgreSQL 15
- **Testing:** Vitest (unit), Testkube (integration/E2E)
- **Deployment:** Kubernetes, Helm
- **Observability:** OpenTelemetry

## License

MIT
