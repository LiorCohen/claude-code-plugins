---
name: init-project
description: Initialize a new project from the spec-driven template.
---

# /project:init-project

Initialize a new spec-driven project.

## Usage

```
/project:init-project [project-name]
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

**CRITICAL:** You MUST complete ALL steps below. Do not stop until every single step is finished.

When invoked:

### Step 1: Prompt for project name (if not provided as argument)

### Step 2: Create the complete directory structure

Create ALL of these directories:

```bash
mkdir -p <project-name>/{specs/{domain/entities,architecture,features,plans},components/{contract,server/src/{server,config,controller,model/{definitions,use-cases},dal,telemetry},webapp/src,helm,testing},.github/workflows}
```

### Step 3: Copy ALL template files

Copy every template file with variable substitution:

**Root files:**
- Copy `templates/project/README.md` → `<project-name>/README.md` (replace `{{PROJECT_NAME}}`)
- Copy `templates/project/CLAUDE.md` → `<project-name>/CLAUDE.md` (replace `{{PROJECT_NAME}}`)
- Copy `templates/project/package.json` → `<project-name>/package.json` (replace `{{PROJECT_NAME}}`)

**Spec files:**
- Copy `templates/specs/INDEX.md` → `<project-name>/specs/INDEX.md`
- Copy `templates/specs/SNAPSHOT.md` → `<project-name>/specs/SNAPSHOT.md`
- Copy `templates/specs/glossary.md` → `<project-name>/specs/domain/glossary.md`
- Create `<project-name>/specs/architecture/overview.md` with basic architecture description

**Contract component:**
- Copy `templates/components/contract/package.json` → `<project-name>/components/contract/package.json` (replace `{{PROJECT_NAME}}`)
- Copy `templates/components/contract/openapi.yaml` → `<project-name>/components/contract/openapi.yaml` (replace `{{PROJECT_NAME}}`)
- Create `<project-name>/components/contract/.gitignore` with:
  ```
  node_modules/
  generated/
  ```

**Server component:**
- Copy `templates/components/server/package.json` → `<project-name>/components/server/package.json` (replace `{{PROJECT_NAME}}`)
- Copy `templates/components/server/tsconfig.json` → `<project-name>/components/server/tsconfig.json`
- Create `<project-name>/components/server/.gitignore` with:
  ```
  node_modules/
  dist/
  .env
  ```
- Create `<project-name>/components/server/src/index.ts` with minimal entry point

**Webapp component:**
- Copy `templates/components/webapp/package.json` → `<project-name>/components/webapp/package.json` (replace `{{PROJECT_NAME}}`)
- Copy `templates/components/webapp/tsconfig.json` → `<project-name>/components/webapp/tsconfig.json`
- Create `<project-name>/components/webapp/.gitignore` with:
  ```
  node_modules/
  dist/
  .env
  ```
- Create `<project-name>/components/webapp/src/App.tsx` with minimal React app
- Create `<project-name>/components/webapp/index.html` with basic HTML template
- Create `<project-name>/components/webapp/vite.config.ts` with basic Vite config

### Step 4: Initialize git repository

```bash
cd <project-name> && git init && git add . && git commit -m "Initial project setup from spec-driven template"
```

### Step 5: Create .gitignore at root

Create `<project-name>/.gitignore`:
```
node_modules/
.env
.DS_Store
dist/
*.log
```

### Step 6: Verify completion

After ALL steps are done, list the created structure to confirm:

```bash
tree <project-name> -L 3 -I node_modules
```

**DO NOT STOP until you have completed every single step above and verified the structure.**

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
