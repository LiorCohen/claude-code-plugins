---
name: sdd-init
description: Initialize a new SDD project with minimal structure.
---

# /sdd-init

Initialize a new spec-driven project with minimal structure. Components are scaffolded on-demand when you create changes that need them.

## Usage

```
/sdd-init
```

**No arguments required.** Project name is derived from the current directory.

**Examples:**
```bash
cd my-app
/sdd-init
```

## Workflow

This command follows an approval-based workflow that verifies environment, creates minimal structure, and prepares for change-driven development.

| Phase | Purpose |
|-------|---------|
| 0     | Detect project name from current directory |
| 1     | Environment verification (tools, plugin, permissions) |
| 2     | Create minimal structure (config component only) |
| 3     | Git init + commit |
| 4     | Completion message |

**What's NOT done during init (deferred to first change):**
- Product discovery
- Domain population
- Full component scaffolding
- Creating `changes/` directory
- Creating `specs/domain/` or `specs/architecture/`

---

## Phase Tracking (CRITICAL)

**You MUST complete ALL phases before declaring initialization complete.** Use this checklist to track progress:

```
[ ] Phase 0: Project name detected and confirmed
[ ] Phase 1: Environment verified (tools, plugin, permissions)
[ ] Phase 2: Minimal structure created
[ ] Phase 3: Git repository initialized and committed
[ ] Phase 4: Completion report displayed
```

**DO NOT:**
- Stop after environment verification without completing structure creation
- Declare "initialization complete" until Phase 5 is finished
- Ask the user "should I continue?" between phases - just proceed

---

### Phase 0: Detect Project Name

**No arguments needed.** Derive project name from the current directory:

```
Initializing SDD project...

Detected project name: my-app (from current directory)
Is this correct? (yes/no)
```

**Project Name Rules:**
- Derived from `basename(pwd)` (current directory name)
- Validated: lowercase letters, numbers, hyphens only
- Spaces/special chars: prompt user to provide a valid name
- Empty directory name: prompt user to provide a name

If user says no: Ask for project name interactively.

**Existing Project Check:**
If `.sdd/sdd-settings.yaml` exists, this is an existing SDD project. Switch to **upgrade/repair mode**:

```
Existing SDD project detected.

Running environment check...
  ✓ Plugin v5.11.0 (up to date)
  ✓ All required tools available
  ✓ Permissions configured

Checking project structure...
  ✓ .sdd/sdd-settings.yaml exists
  ✓ specs/INDEX.md exists
  ⚠ components/config/ missing

Would you like to add missing components? (yes/no)
```

If yes: Add only missing pieces, **never overwrite existing files**.
If no: Exit gracefully.

**Running sdd-init multiple times is always safe.**

---

### Phase 1: Environment Verification

**INVOKE the `check-tools` skill** with:
```yaml
required: [node, npm, git, docker]
optional: [jq, kubectl, helm]
```

#### 1.1 Plugin Update Check

```
Checking for plugin updates...

Current version: 5.11.0
Latest version:  5.12.0

A newer version is available. It's recommended to upgrade before initializing.
Would you like to stop and upgrade? (yes/no)
```

If yes: Exit with instructions to run `claude plugins update sdd`
If no: Continue with current version

#### 1.2 Required Tools Check

```
Checking required tools...

  ✓ node (v20.10.0)
  ✓ npm (v10.2.3)
  ✓ git (v2.42.0)
  ✓ docker (v24.0.6)
```

If any missing: Show installation instructions and **exit** (do not continue).

#### 1.3 Optional Tools Check

```
Checking optional tools...

  ⚠ jq not found (needed for hooks)
  ⚠ kubectl not found (needed for Kubernetes deployments)
  ⚠ helm not found (needed for Kubernetes charts)

These are optional - some features may be limited without them.
```

Continue even if optional tools are missing.

#### 1.4 Plugin Build Check

```
Checking plugin installation...

  ✓ Plugin installed at ~/.claude/plugins/sdd
  ⚠ Plugin system not built

Building plugin system...
  Running npm install in ~/.claude/plugins/sdd/system/
  ✓ Plugin system ready
```

If `~/.claude/plugins/sdd/system/node_modules` doesn't exist, run:
```bash
cd ~/.claude/plugins/sdd/system && npm install
```

#### 1.5 Permissions Check

```
Checking permissions...

  ⚠ SDD permissions not configured

Would you like me to configure recommended permissions automatically? (yes/no)
```

**If yes:**
Run `/sdd-run permissions configure` to merge SDD permissions into `.claude/settings.local.json`.

**If no:**
```
You can configure permissions later by running:

  /sdd-run permissions configure

This will merge SDD recommended permissions into your .claude/settings.local.json
```

---

### Phase 2: Create Minimal Structure

**INVOKE the `project-scaffolding` skill** with:

```yaml
mode: minimal
project_name: <from Phase 0>
target_dir: <current directory>
```

Create only:

```
<project>/
├── .sdd/
│   └── sdd-settings.yaml    # Contains only config component
├── specs/
│   └── INDEX.md             # Empty spec registry
├── components/
│   └── config/              # Only config is scaffolded
│       ├── package.json
│       ├── tsconfig.json
│       ├── envs/
│       │   ├── default/config.yaml
│       │   └── local/config.yaml
│       ├── schemas/config.schema.json
│       └── types/index.ts
├── .gitignore
├── README.md
└── CLAUDE.md
```

**NOT created during init (created on first change):**
- `changes/` directory
- `specs/domain/` subdirectories
- `specs/architecture/` subdirectories
- Any component besides config

**sdd-settings.yaml format:**

```yaml
# ============================================================================
# SDD PROJECT SETTINGS - DO NOT EDIT MANUALLY
# ============================================================================
# This file is generated and maintained by SDD commands.
# To modify settings, use: /sdd-settings
# ============================================================================

sdd:
  plugin_version: "5.11.0"
  initialized_at: "2026-02-02"
  last_updated: "2026-02-02"

project:
  name: "my-app"
  # description and domain are populated as you build features
  # description: "A task management application"
  # domain: "Task Management"

# Components are added here as they are scaffolded via /sdd-change new
# The first change targeting a component type triggers scaffolding.
#
# Example after scaffolding a server:
#   - name: my-app-server
#     type: server
#     settings:
#       server_type: api
#       databases: []
#       provides_contracts: []
#
# Example after scaffolding a webapp:
#   - name: my-app-webapp
#     type: webapp
#     settings:
#       contracts: []

components:
  - name: config
    type: config
    settings: {}
```

---

### Phase 3: Git Init + Commit

Initialize git repository (if not already in one):
```bash
git init
```

Stage and commit all created files:

```bash
git add .
git commit -m "$(cat <<'EOF'
Initialize SDD project: <project-name>

- Created minimal SDD structure
- Config component ready
- Spec registry initialized

Components will be scaffolded on-demand as changes are created.

Co-Authored-By: SDD Plugin vX.Y.Z
EOF
)"
```

---

### Phase 4: Completion Message

```
═══════════════════════════════════════════════════════════════
 PROJECT INITIALIZED: my-app
═══════════════════════════════════════════════════════════════

Location: /path/to/my-app

ENVIRONMENT:
  ✓ Plugin v5.11.0 (up to date)
  ✓ All required tools available
  ⚠ kubectl, helm not installed (optional)

WHAT'S INCLUDED:
  ✓ SDD configuration (.sdd/sdd-settings.yaml)
  ✓ Config component (components/config/)
  ✓ Spec registry (specs/INDEX.md)

NEXT STEPS:

  Start with a feature idea:
    /sdd-change new --type feature --name <your-first-feature>

  Or import an existing spec:
    /sdd-change new --spec path/to/requirements.md

  Components will be scaffolded on-demand when your changes need them.
```

---

## Non-Destructive Behavior (CRITICAL)

sdd-init NEVER overwrites existing files:

- If `.sdd/sdd-settings.yaml` exists: switch to upgrade/repair mode
- If `specs/INDEX.md` exists: skip (don't overwrite)
- If `components/config/` exists: skip (don't overwrite)
- Only add missing pieces, never modify existing content

---

## Available Component Types

Components are scaffolded on-demand when your first change needs them. Available types:

| Type | Description |
|------|-------------|
| **Server** | Node.js/TypeScript backend with CMDO architecture |
| **Webapp** | React/TypeScript frontend with MVVM pattern |
| **Database** | PostgreSQL migrations, seeds, and management scripts |
| **Contract** | OpenAPI specifications and type generation |
| **Helm** | Kubernetes deployment charts |
| **Testing** | Testkube test definitions |
| **CI/CD** | GitHub Actions workflow definitions |

When you run `/sdd-change new`, the system will scaffold needed components automatically.

---

## Important Notes

- **No arguments needed** - project name from current directory
- **Minimal structure** - only config component scaffolded during init
- **Environment verified** - tools, plugin, permissions checked upfront
- **Safe to re-run** - never overwrites existing files
- **Change-driven scaffolding** - components created when first needed via `/sdd-change new`
- **To import an external spec:** Use `/sdd-change new --spec <path>` after initialization
