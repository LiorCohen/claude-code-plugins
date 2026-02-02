---
id: 78
title: Minimal sdd-init redesign
priority: high
status: planning
created: 2026-02-02
depends_on: []
blocks: []
---

# Task 78: Minimal sdd-init redesign

## Description

Redesign sdd-init to be minimal and change-driven instead of doing comprehensive product discovery and full scaffolding upfront.

**Current problems:**
1. **System node_modules not installed**: Plugin dependencies not installed from marketplace
2. **Permission prompts**: No Read permissions for plugin directory
3. **Too much upfront**: Product discovery, full scaffolding, spec population - all before user has written any code

**New approach:**
- sdd-init takes NO ARGUMENTS - project name from current directory
- Verifies environment (tools, plugin, permissions) before anything else
- Checks for plugin updates and offers to upgrade
- Creates minimal structure (`.sdd/`, `specs/INDEX.md`, `components/config/`)
- Asks about initial components but defers scaffolding (scaffolded: false)
- No product discovery, no spec population
- Components are scaffolded on first change that needs them (via sdd-new-change)

## Acceptance Criteria

### No Arguments
- [ ] sdd-init takes no arguments
- [ ] Project name derived from current directory
- [ ] Confirm project name with user

### Environment Verification
- [ ] Create `check-tools` skill for reusable tool verification
- [ ] Required tools: node, npm, git, docker (fail if missing)
- [ ] Optional tools: jq, kubectl, helm (warn if missing)
- [ ] Check for plugin updates and offer to stop and upgrade if newer version available
- [ ] Auto-build plugin system if node_modules not installed
- [ ] Guide user to configure permissions (or apply recommended-permissions.json)
- [ ] Other commands should also use `check-tools` skill for their requirements

### Permissions
- [ ] Add `Read(~/.claude/plugins/sdd/**)` to recommended-permissions.json
- [ ] Update PERMISSIONS.md to document the Read permission
- [ ] sdd-init offers to automatically configure permissions in `.claude/settings.local.json`
- [ ] Add `/sdd-run permissions configure` command
- [ ] Always backup existing settings.local.json before modifying

### Minimal Init
- [ ] sdd-init creates minimal structure: `.sdd/sdd-settings.yaml`, `specs/INDEX.md`, `components/config/`
- [ ] sdd-settings.yaml contains only config component + helpful comments showing examples
- [ ] Comments in sdd-settings.yaml show what gets populated as changes are introduced
- [ ] Remove product-discovery phase from sdd-init
- [ ] Remove domain-population phase from sdd-init
- [ ] Remove full scaffolding phase from sdd-init (only config component scaffolded)
- [ ] No changes/ directory created during init
- [ ] No specs/domain/ or specs/architecture/ created during init

### Non-Destructive (CRITICAL)
- [ ] sdd-init NEVER overwrites existing files
- [ ] On existing project: switch to "upgrade/repair" mode
- [ ] Only add missing pieces, never modify existing content
- [ ] Running sdd-init multiple times is always safe

### On-Demand Scaffolding (sdd-new-change)
- [ ] sdd-new-change detects unscaffolded components by checking if `components/{type}/` exists
- [ ] Triggers scaffolding before proceeding with change
- [ ] Adds new component entry to sdd-settings.yaml after scaffolding
- [ ] Updates config component with new sections

### Schema Changes
- [ ] sdd-settings.yaml has header comment: "DO NOT EDIT MANUALLY - use /sdd-settings"
- [ ] sdd-settings.yaml only contains scaffolded components (no empty entries)
- [ ] Helpful comments in sdd-settings.yaml show examples of what gets added

### Documentation
- [ ] Update sdd-init.md with new workflow (no args, env verification, minimal)
- [ ] Update sdd-new-change.md with on-demand scaffolding
- [ ] Update getting-started.md to reflect change-driven approach
