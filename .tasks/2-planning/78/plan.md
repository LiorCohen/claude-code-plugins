---
title: Minimal sdd-init redesign
created: 2026-02-02
updated: 2026-02-02
---

# Plan: Minimal sdd-init Redesign

## Problem Summary

The current sdd-init does too much upfront:
- Product discovery (interactive Q&A about the product)
- Component recommendation with settings
- Full scaffolding of all components
- Domain population (glossary, personas, use cases)

This creates a heavy initialization experience before the user has written any code. Additionally:
- Plugin system node_modules not installed from marketplace
- No Read permissions for plugin directory
- No environment verification (missing tools cause failures mid-init)
- No plugin update check

## New sdd-init Workflow

### Phase 0: Detect Project Name (NO ARGUMENTS)

sdd-init takes **no arguments**. Project name is derived from current directory:

```
Initializing SDD project...

Detected project name: my-app (from current directory)
Is this correct? (yes/no)
```

If no: Ask for project name interactively.

**Project Name Rules:**
- Derived from `basename(pwd)` (current directory name)
- Validated: lowercase letters, numbers, hyphens only
- Spaces/special chars: prompt user to provide a valid name
- Empty directory name: prompt user to provide a name

### Phase 1: Environment Verification

**1.1 Plugin Update Check**
```
Checking for plugin updates...

Current version: 5.11.0
Latest version:  5.12.0

A newer version is available. It's recommended to upgrade before initializing.
Would you like to stop and upgrade? (yes/no)
```

If yes: Exit with instructions to run `claude plugins update sdd`

**1.2 Required Tools Check**
```
Checking required tools...

  ✓ node (v20.10.0)
  ✓ npm (v10.2.3)
  ✓ git (v2.42.0)
  ✓ docker (v24.0.6)
```

If any missing: Show installation instructions and exit.

**1.2b Optional Tools Check**
```
Checking optional tools...

  ⚠ jq not found (needed for hooks)
  ⚠ kubectl not found (needed for Helm deployments)
  ⚠ helm not found (needed for Kubernetes charts)

These are optional - some features may be limited without them.
```

**1.3 Plugin Build Check**
```
Checking plugin installation...

  ✓ Plugin installed at ~/.claude/plugins/sdd
  ⚠ Plugin system not built

Building plugin system...
  Running npm install in ~/.claude/plugins/sdd/system/
  ✓ Plugin system ready
```

**1.4 Permissions Check**
```
Checking permissions...

  ⚠ SDD permissions not configured

Would you like me to configure recommended permissions automatically? (yes/no)
```

**If yes - attempt automatic configuration:**
1. If `.claude/settings.local.json` exists, backup to `.claude/settings.local.json.backup`
2. Read existing `.claude/settings.local.json` (or create if doesn't exist)
3. Merge in SDD recommended permissions
4. Write updated file
5. Display: "✓ Permissions configured in .claude/settings.local.json (backup saved)"

**If automatic fails or user says no:**
```
You can configure permissions later by running:

  /sdd-run permissions configure

This will merge SDD recommended permissions into your .claude/settings.local.json
```

### Phase 2: Quick Component Selection

```
What components will your project need? (you can add more later via /sdd-new-change)

[ ] API Server (Node.js backend)
[ ] Web App (React frontend)
[ ] Database (PostgreSQL)
[ ] Contract (OpenAPI spec)
[ ] I don't know yet (skip - add components later)
```

If "I don't know yet" selected: Skip component selection entirely, proceed with just config component.

**Note:** Selections are NOT stored in sdd-settings.yaml. The settings file only contains scaffolded components. User selections during init are informational only - they appear in the completion message to remind users what they planned to build.

### Phase 3: Create Minimal Structure

Create only:
```
<project>/
├── .sdd/
│   └── sdd-settings.yaml    # Contains only config component (minimal)
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

**NOT created during init (deferred to first change):**
- `changes/` directory
- `specs/domain/` subdirectories
- `specs/architecture/` subdirectories
- `specs/SNAPSHOT.md`
- Any component besides config

### Phase 4: Git Init + Commit
- Initialize git repository (if not already in one)
- Commit minimal structure

### Phase 5: Completion Message

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

PLANNED COMPONENTS (will be scaffolded on first change):
  • server
  • webapp
  • database

NEXT STEPS:

  Start with a feature idea:
    /sdd-new-change --type feature --name <your-first-feature>

  Or import an existing spec:
    /sdd-new-change --spec path/to/requirements.md

  The first change to each component type will scaffold it automatically.
```

---

## sdd-settings.yaml Schema Change

**Minimal schema with helpful comments (no empty sections):**

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

# Components are added here as they are scaffolded via /sdd-new-change
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

**Key changes:**
- No `scaffolded: false` entries - components only appear when scaffolded
- Comments show examples of what gets added
- sdd-new-change detects unscaffolded components by checking if `components/{type}/` directory exists
- Cleaner, more readable file

---

## sdd-new-change On-Demand Scaffolding

### Detection Logic

When sdd-new-change is invoked:

1. Read `.sdd/sdd-settings.yaml`
2. Ask user which components are affected by this change
3. For each affected component type:
   - Check if `components/{type}/` directory exists
   - If not, trigger scaffolding before proceeding

### Scaffolding Trigger

```
You've selected 'server' as an affected component.

This component hasn't been scaffolded yet. Scaffolding now...

  Creating components/server/
  ✓ Package structure created
  ✓ CMDO architecture initialized
  ✓ Config sections added

Server component is ready. Continuing with change creation...
```

### Implementation Details

1. **Read project name** from `sdd-settings.yaml` → `project.name`
2. **Invoke scaffolding skill** for the component type:
   - `backend-scaffolding` for server
   - `frontend-scaffolding` for webapp
   - `database-scaffolding` for database
   - `contract-scaffolding` for contract
3. **Pass project context**:
   ```yaml
   project_name: <from sdd-settings.yaml>
   target_dir: <current directory>
   component_type: server  # or webapp, database, etc.
   ```
4. **Add component to sdd-settings.yaml**: Append new component entry
5. **Update config component**: Add config sections for new component
6. **Continue with change creation**

### Files to Modify in sdd-new-change.md

- Invoke `product-discovery` skill to understand the change (mandatory)
- Invoke `component-recommendation` skill to recommend affected components (mandatory)
- Invoke `domain-population` skill to update glossary with entities (mandatory)
- Add "on-demand scaffolding" phase after component selection
- Add logic to detect unscaffolded components (check if directory exists)
- Add scaffolding invocation with project context

---

## What Happens to Existing Skills

| Skill | Current Use | New Status |
|-------|-------------|------------|
| `product-discovery` | sdd-init Phase 1 | **Move to sdd-new-change** - mandatory for every change |
| `domain-population` | sdd-init Phase 6.3 | **Move to sdd-new-change** - mandatory, populates glossary |
| `component-recommendation` | sdd-init Phase 2 | **Move to sdd-new-change** - mandatory, recommends affected components |
| `scaffolding` (orchestrator) | sdd-init Phase 6.2 | **Remove from init** - individual skills called on-demand |
| `project-scaffolding` | Creates root structure | **Simplify** - minimal version for init |
| `config-scaffolding` | Creates config component | **Keep** - called during init |
| `backend-scaffolding` | Creates server component | **Keep** - called on-demand |
| `frontend-scaffolding` | Creates webapp component | **Keep** - called on-demand |
| `database-scaffolding` | Creates database component | **Keep** - called on-demand |
| `contract-scaffolding` | Creates contract component | **Keep** - called on-demand |
| `helm-scaffolding` | Creates helm charts | **Keep** - called on-demand |
| `project-settings` | Creates sdd-settings.yaml | **No changes** - already supports adding components |

---

## Config Component During Init

When no components are selected besides config, the config component is minimal:

```yaml
# envs/default/config.yaml
# Base configuration for my-app

# Add component configurations as they are scaffolded
```

When components are scaffolded on-demand, config sections are added:

```yaml
# envs/default/config.yaml
# Base configuration for my-app

server:
  port: 3000
  probesPort: 9090
  logLevel: info
```

---

## External Spec Mode (sdd-new-change --spec)

This mode still works but is unaffected by init changes:

1. User runs `/sdd-new-change --spec path/to/spec.md`
2. sdd-new-change invokes `product-discovery` on the spec
3. Creates epics/features from spec hierarchy
4. Does NOT trigger component scaffolding (specs only)

Component scaffolding happens when implementing those specs.

---

## Files to Modify

### Commands

| File | Changes |
|------|---------|
| [plugin/commands/sdd-init.md](plugin/commands/sdd-init.md) | Complete rewrite - no args, env verification, minimal workflow |
| [plugin/commands/sdd-new-change.md](plugin/commands/sdd-new-change.md) | Add on-demand scaffolding detection and trigger |
| [plugin/commands/sdd-run.md](plugin/commands/sdd-run.md) | Add `permissions` namespace documentation |

### Skills

| File | Changes |
|------|---------|
| [plugin/skills/project-scaffolding/SKILL.md](plugin/skills/project-scaffolding/SKILL.md) | Simplify to minimal mode (config only, no specs/domain, no changes/) |

### Hooks and Permissions

| File | Changes |
|------|---------|
| [plugin/hooks/recommended-permissions.json](plugin/hooks/recommended-permissions.json) | Add Read permissions for plugin directory |
| [plugin/hooks/PERMISSIONS.md](plugin/hooks/PERMISSIONS.md) | Document Read permission |

### Tests (WILL FAIL - Need Update)

| File | Changes |
|------|---------|
| [tests/src/tests/workflows/sdd-init.test.ts](tests/src/tests/workflows/sdd-init.test.ts) | **Major rewrite** - currently expects full scaffolding (server, webapp, contract, specs/domain/, changes/). Update to verify minimal init (config only, specs/INDEX.md) |

### Documentation

| File | Changes |
|------|---------|
| [docs/getting-started.md](docs/getting-started.md) | **Major rewrite** - remove `--name` arg, show minimal structure, explain change-driven scaffolding |
| [docs/commands.md](docs/commands.md) | Update /sdd-init section - no args, no product discovery, minimal workflow |
| [docs/workflows.md](docs/workflows.md) | Minor update - mention that first change may trigger component scaffolding |

## New Files to Create

| File | Purpose |
|------|---------|
| [plugin/skills/check-tools/SKILL.md](plugin/skills/check-tools/SKILL.md) | Skill to verify required/optional tools are installed |
| [plugin/system/src/commands/permissions.ts](plugin/system/src/commands/permissions.ts) | Handler for `/sdd-run permissions configure` |

### check-tools Skill

Reusable skill that commands invoke to verify tools are available.

**Skill Structure:**
```
plugin/skills/check-tools/
├── SKILL.md           # Skill definition
└── templates/         # (none needed - no file generation)
```

**Input:**
```yaml
required: [node, npm, git, docker]  # Fail if any missing
optional: [jq, kubectl, helm]       # Warn if missing
```

**Output:**
```yaml
success: true/false
missing_required: []
missing_optional: [jq, kubectl]
versions:
  node: "v20.10.0"
  npm: "v10.2.3"
  git: "v2.42.0"
  docker: "v24.0.6"
```

**Version Detection Commands:**
| Tool | Detection Command | Version Extraction |
|------|-------------------|-------------------|
| node | `node --version` | Output directly (e.g., "v20.10.0") |
| npm | `npm --version` | Output directly (e.g., "10.2.3") |
| git | `git --version` | Parse "git version X.Y.Z" |
| docker | `docker --version` | Parse "Docker version X.Y.Z" |
| jq | `jq --version` | Output directly (e.g., "jq-1.6") |
| kubectl | `kubectl version --client -o json` | Parse JSON `.clientVersion.gitVersion` |
| helm | `helm version --short` | Output directly (e.g., "v3.12.0") |

**Error Handling:**
- If command returns non-zero exit code → tool not installed
- If command times out (>5s) → treat as not installed
- Report all missing tools at once (don't fail on first)

**Tool Requirements by Command:**

| Command | Required | Optional |
|---------|----------|----------|
| `/sdd-init` | node, npm, git, docker | jq, kubectl, helm |
| `/sdd-new-change` | node, npm, git | - |
| `/sdd-local-env start` | docker | kubectl, helm |
| `/sdd-implement-change` | node, npm, git | - |

Commands invoke this skill at the start and fail gracefully if required tools are missing.

### /sdd-run permissions namespace

Add `permissions` namespace to the system CLI and `/sdd-run` command:

```bash
/sdd-run permissions configure
```

**What it does:**
1. If `.claude/settings.local.json` exists, backup to `.claude/settings.local.json.backup`
2. Read existing `.claude/settings.local.json` (or create `{}` if doesn't exist)
3. Read SDD recommended permissions from `~/.claude/plugins/sdd/hooks/recommended-permissions.json`
4. Merge permissions using deep merge strategy (see below)
5. Write updated file
6. Display: "✓ Permissions configured in .claude/settings.local.json (backup saved)"

**Merge Strategy:**
```typescript
// Deep merge: user settings preserved, SDD permissions added
// If both have same key:
//   - Arrays: concat and dedupe
//   - Objects: recursive merge
//   - Primitives: user value wins (preserve user overrides)

// Example:
// User has:   { "permissions": { "allow": ["Bash(npm *)"] } }
// SDD adds:   { "permissions": { "allow": ["Read(~/.claude/plugins/sdd/**)"] } }
// Result:    { "permissions": { "allow": ["Bash(npm *)", "Read(~/.claude/plugins/sdd/**)"] } }
```

**Backup Handling:**
- Backup file: `.claude/settings.local.json.backup`
- If backup already exists: overwrite (single backup only)
- Backup created BEFORE any modifications

**Error Handling:**
- If no write permission: exit with error and instructions
- If JSON parse fails: exit with error (don't corrupt file)
- If backup fails: exit with error (don't proceed without backup)

**Files to update:**
- `plugin/commands/sdd-run.md` - Document the new `permissions` namespace
- `plugin/system/src/commands/` - Add `permissions.ts` command handler

**Used by:**
- sdd-init invokes this during Phase 1.4
- Users who skipped permission setup during init
- Users who want to refresh permissions after plugin update

## Files NOT Modified (kept for other uses)

| File | Reason |
|------|--------|
| [plugin/skills/product-discovery/](plugin/skills/product-discovery/) | Used by sdd-new-change --spec mode |
| [plugin/skills/domain-population/](plugin/skills/domain-population/) | May be useful for manual invocation |
| [plugin/skills/component-recommendation/](plugin/skills/component-recommendation/) | May be useful for architecture discussions |

---

## Changes Summary

### 1. Add Read Permission for Plugin Directory
Add `Read(~/.claude/plugins/sdd/**)` to recommended-permissions.json.

### 2. Document Read Permission in PERMISSIONS.md
Add section explaining Read permissions for plugin access.

### 3. Rewrite sdd-init.md (NO ARGUMENTS)
- Phase 0: Detect project name from current directory
- Phase 1: Environment verification (plugin update, tools, build, permissions)
- Phase 2: Quick component selection (informational checkboxes)
- Phase 3: Create minimal structure (config only)
- Phase 4: Git init + commit
- Phase 5: Completion message (shows planned components from Phase 2)

### 4. Update project-settings skill
- No schema changes needed - components only appear when scaffolded
- Init creates settings with just config component

### 5. Update sdd-new-change for On-Demand Scaffolding
- After component selection, check if `components/{type}/` directory exists
- If directory missing, trigger scaffolding before proceeding
- Add new component to sdd-settings.yaml after scaffolding
- Update config component with new sections

### 6. Update Getting Started Docs
- sdd-init has no arguments
- Project name from current directory
- Change-driven scaffolding model

---

## Edge Cases

### User runs sdd-init in existing SDD project (NON-DESTRUCTIVE)

sdd-init is **never destructive**. When run on an existing project:

1. **Detect existing project**: Check for `.sdd/sdd-settings.yaml`
2. **If exists**: Switch to "upgrade/repair" mode
   - Skip project name confirmation (read from existing settings)
   - Run environment verification (tools, plugin version, permissions)
   - Check for missing structure and offer to add it
   - **Never overwrite existing files**

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

If user says yes: Add only missing pieces, never overwrite.
If user says no: Exit gracefully.

**Key principle**: Running sdd-init multiple times is always safe.

### User runs sdd-new-change before sdd-init
- Detect no `.sdd/sdd-settings.yaml`
- Error: "No SDD project found. Run /sdd-init first."

### User selects no components during init
- Only config component is created
- sdd-settings.yaml has only config
- All components added via sdd-new-change later

### Component scaffolding fails mid-change
- Rollback scaffolding changes (delete partially created directory)
- sdd-settings.yaml remains unchanged (component not added)
- Allow retry

### Multiple components need scaffolding for one change
- Scaffold all needed components sequentially
- Update sdd-settings.yaml after each
- Then proceed with change creation

### First change creates changes/ directory
- sdd-new-change creates `changes/` directory if it doesn't exist
- Creates `specs/domain/` structure if missing

### Every change uses discovery skills
- `product-discovery` - understands what the change is about
- `component-recommendation` - recommends which components are affected
- `domain-population` - updates glossary with new entities from the change

---

## Dependencies

1. Read permissions - independent
2. check-tools skill - needed by sdd-init Phase 1
3. permissions command - needed by sdd-init Phase 1.4
4. sdd-init rewrite - core work (depends on 1, 2, 3)
5. project-scaffolding simplification - needed by sdd-init Phase 3
6. sdd-new-change update - depends on scaffolding skills for on-demand scaffolding

---

## Tests

### Manual Tests

- [ ] `test_no_arguments` - sdd-init works with no arguments
- [ ] `test_project_name_detection` - Derives name from current directory
- [ ] `test_plugin_update_check` - Detects when newer plugin version available
- [ ] `test_required_tools_check` - Fails gracefully if node/npm/git/docker missing
- [ ] `test_optional_tools_check` - Warns but continues if kubectl/helm missing
- [ ] `test_plugin_auto_build` - Auto-installs node_modules if missing
- [ ] `test_permissions_check` - Warns about missing Read permissions
- [ ] `test_minimal_init` - Creates only .sdd/, specs/INDEX.md, components/config/
- [ ] `test_minimal_settings` - sdd-settings.yaml only contains config component after init
- [ ] `test_no_product_discovery` - No interactive discovery questions
- [ ] `test_on_demand_scaffolding` - First change to server triggers server scaffolding
- [ ] `test_config_update_on_scaffold` - Config sections added when component scaffolded
- [ ] `test_discovery_skills` - Every sdd-new-change uses product-discovery, component-recommendation, domain-population
- [ ] `test_existing_project_warning` - Warns if .sdd/ already exists

### Documentation Review

- [ ] `review_sdd_init_command` - Reflects no args, env verification, minimal workflow
- [ ] `review_sdd_new_change_command` - Reflects on-demand scaffolding and domain population
- [ ] `review_getting_started` - Reflects change-driven approach
- [ ] `review_permissions` - Read permissions documented

---

## Verification

- [ ] `/sdd-init` works with no arguments
- [ ] Project name derived from current directory name
- [ ] sdd-init checks for plugin updates before proceeding
- [ ] sdd-init verifies required tools and exits with instructions if missing
- [ ] sdd-init warns about optional tools based on selected components
- [ ] sdd-init auto-builds plugin system if node_modules missing
- [ ] sdd-init guides user to configure permissions
- [ ] Only config component is scaffolded during init
- [ ] sdd-settings.yaml only contains config component (no unscaffolded entries)
- [ ] No specs are created during init (except INDEX.md)
- [ ] No changes/ directory created during init
- [ ] First /sdd-new-change targeting server scaffolds server automatically
- [ ] Every /sdd-new-change uses product-discovery, component-recommendation, domain-population
- [ ] Config component updated with server sections after scaffolding
- [ ] sdd-settings.yaml has new component entry after scaffolding
