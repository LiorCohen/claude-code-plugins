---
id: 65
title: Move external spec handling from sdd-init to sdd-new-change
priority: medium
status: open
created: 2026-01-31
depends_on: []
blocks: []
---

# Task 65: Move external spec handling from sdd-init to sdd-new-change

## Description

External spec handling should be moved from `sdd-init` to `sdd-new-change` to better separate concerns:

- **`sdd-init`** should focus solely on project initialization (scaffolding, settings, git setup)
- **`sdd-new-change`** should handle all change creation, including from external specs

This makes sense because:
1. External spec import can happen at any time, not just during project initialization
2. `sdd-new-change` is already the entry point for creating changes
3. Cleaner separation of responsibilities

## Changes Required

### Remove from `sdd-init`

| File | Changes |
|------|---------|
| `plugin/commands/sdd-init.md` | Remove `--spec` argument, remove Phase 7 (external-spec-integration) |

### Add to `sdd-new-change`

| File | Changes |
|------|---------|
| `plugin/commands/sdd-new-change.md` | Add `--spec <path>` argument, integrate external-spec-integration skill |

### Update skill

| File | Changes |
|------|---------|
| `plugin/skills/external-spec-integration/SKILL.md` | Update "When to Use" section to reference sdd-new-change instead of sdd-init |

## New Usage

```bash
# Create change interactively
/sdd-new-change --type feature --name user-auth

# Create change(s) from external spec
/sdd-new-change --spec /path/to/external-spec.md
```

When `--spec` is provided:
- `--type` and `--name` become optional (derived from spec analysis)
- External spec integration skill handles decomposition, user adjustments, and change creation
- Same archive/self-sufficient spec behavior as before

## Acceptance Criteria

- [ ] `sdd-init` no longer accepts `--spec` argument
- [ ] `sdd-init` no longer has Phase 7 (external-spec-integration)
- [ ] `sdd-new-change` accepts `--spec <path>` argument
- [ ] `sdd-new-change --spec` invokes external-spec-integration skill
- [ ] External spec workflow produces same output (archived spec, self-sufficient SPEC.md files)
- [ ] Documentation updated to reflect new command structure

## Consolidated

- #41: sdd-new-change should handle external specs
