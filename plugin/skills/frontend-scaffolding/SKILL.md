---
name: frontend-scaffolding
description: Scaffolds React/TypeScript frontend components with MVVM architecture.
---

# Frontend Scaffolding Skill

Creates a React/TypeScript frontend component following the MVVM (Model-View-ViewModel) architecture with TanStack ecosystem.

## When to Use

This skill is called by the main `scaffolding` skill when creating webapp components. It can create multiple named instances (e.g., `webapp-admin`, `webapp-public`).

## What It Creates

```
components/<webapp-name>/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .gitignore
└── src/
    ├── main.tsx              # Entry point
    ├── app.tsx               # Root app component
    ├── index.css             # Global styles (Tailwind)
    ├── pages/
    │   ├── index.ts
    │   ├── home.tsx          # Example page
    │   └── greeter.tsx       # Example page
    ├── components/
    │   ├── index.ts
    │   └── sidebar.tsx       # Example component
    ├── viewmodels/           # ViewModel hooks (empty, for user)
    ├── models/               # Domain models (empty, for user)
    ├── services/             # API services (empty, for user)
    ├── stores/               # State stores (empty, for user)
    ├── types/                # Type definitions (empty, for user)
    ├── utils/                # Utilities (empty, for user)
    ├── hooks/
    │   ├── index.ts
    │   └── use-greetings.ts  # Example hook
    └── api/
        ├── index.ts
        └── greetings.ts      # Example API client
```

## MVVM Architecture

| Layer | Purpose | Location |
|-------|---------|----------|
| **M**odel | Domain types and business logic | `src/models/` |
| **V**iew | React components (pages, components) | `src/pages/`, `src/components/` |
| **V**iew**M**odel | State and logic hooks | `src/viewmodels/` |

Plus supporting directories for services, stores, and API clients.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| TailwindCSS | Utility-first CSS |
| TanStack Router | Type-safe routing |
| TanStack Query | Server state management |

## Multiple Instances

Supports multiple named frontend instances:

| Input | Directory Created |
|-------|-------------------|
| `webapp` | `components/webapp/` |
| `webapp:admin` | `components/webapp-admin/` |
| `webapp:public` | `components/webapp-public/` |

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name |
| `{{PROJECT_DESCRIPTION}}` | Project description |
| `{{PRIMARY_DOMAIN}}` | Primary business domain |

## Usage

Called programmatically by the scaffolding script:

```python
from frontend_scaffolding import scaffold_frontend

scaffold_frontend(
    target_dir="/path/to/project",
    component_name="admin",         # Creates webapp-admin/
    project_name="my-app",
)
```

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```
skills/frontend-scaffolding/templates/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .gitignore
└── src/
    ├── main.tsx
    ├── app.tsx
    ├── index.css
    ├── pages/
    ├── components/
    ├── hooks/
    └── api/
```

## Related Skills

- `frontend-standards` - MVVM architecture and TanStack patterns
- `typescript-standards` - TypeScript coding conventions
- `unit-testing` - Unit testing patterns for frontend code
