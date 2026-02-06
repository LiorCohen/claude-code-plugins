---
name: frontend-scaffolding
description: Scaffolds React/TypeScript frontend components with MVVM architecture.
user-invocable: false
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
    │   ├── index.ts          # Empty barrel (add pages as features are implemented)
    │   └── home.tsx          # Home page
    ├── components/
    │   ├── index.ts
    │   └── sidebar.tsx       # Navigation sidebar
    ├── viewmodels/           # ViewModel hooks (empty, for user)
    ├── models/               # Domain models (empty, for user)
    ├── services/             # API services (empty, for user)
    ├── stores/               # State stores (empty, for user)
    ├── types/                # Type definitions (empty, for user)
    ├── utils/                # Utilities (empty, for user)
    ├── hooks/
    │   └── index.ts          # Empty barrel (add hooks as features are implemented)
    └── api/
        └── index.ts          # Empty barrel (add API clients as features are implemented)
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
| `{type: webapp, name: main}` | `components/webapps/main/` |
| `{type: webapp, name: admin}` | `components/webapps/admin/` |
| `{type: webapp, name: public}` | `components/webapps/public/` |

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
skills/components/frontend/frontend-scaffolding/templates/
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

## Config Schema

When scaffolding a webapp component, the following config section is added to `components/config/`:

### Minimal Config (envs/default/config.yaml)

```yaml
webapp-{name}:
  apiBaseUrl: /api
```

### TypeScript Type (types/webapp.ts)

```typescript
export type WebappConfig = Readonly<{
  apiBaseUrl: string;
}>;
```

### JSON Schema (schemas/config.schema.json)

```json
{
  "webapp-{name}": {
    "type": "object",
    "properties": {
      "apiBaseUrl": { "type": "string", "default": "/api" }
    },
    "required": ["apiBaseUrl"]
  }
}
```

### Optional Extensions

Features may extend the config as needed:

```yaml
webapp-{name}:
  apiBaseUrl: /api
  features:
    darkMode: true
    analytics: false
```

---

## Related Skills

- `frontend-standards` - MVVM architecture and TanStack patterns
- `typescript-standards` - TypeScript coding conventions
- `unit-testing` - Unit testing patterns for frontend code
