---
name: init
description: Initialize a new project from the spec-driven template.
---

# /project:init

Initialize a new spec-driven project.

## Usage

```
/project:init [project-name]
```

## What It Creates

```
<project-name>/
├── README.md
├── CLAUDE.md
├── specs/
│   ├── INDEX.md
│   ├── SNAPSHOT.md
│   ├── domain/
│   │   ├── glossary.md
│   │   └── entities/
│   ├── architecture/
│   │   └── overview.md
│   ├── features/
│   └── plans/
├── components/
│   ├── contract/
│   ├── server/
│   ├── webapp/
│   ├── helm/
│   └── testing/
└── .github/
    └── workflows/
        └── ci.yaml
```

## Implementation

When invoked:

1. **Prompt for project name** (if not provided)
2. **Create directory structure** from templates
3. **Initialize git repository**
4. **Set up npm workspaces** in root package.json
5. **Copy template files** for each component
6. **Initialize contract types** with basic OpenAPI spec
7. **Create initial workflows** for CI/CD

## Post-Init Instructions

```
✓ Project initialized: <project-name>

Next steps:
1. cd <project-name>
2. npm install --workspaces
3. cd components/contract && npm run generate:types
4. Create your first feature: /project:new-feature <description>
```

## Template Sources

All template files are in the `templates/` directory of this plugin:
- `templates/project/` - Root project files
- `templates/components/` - Component scaffolding
- `templates/specs/` - Initial spec structure
- `templates/workflows/` - GitHub Actions workflows
