---
title: Reorganize component skills into colocated directory structure
created: 2026-02-06
---

# Plan: Reorganize Component Skills

## Problem Summary

Component-specific skills (standards + scaffolding pairs) are spread flat across `plugin/skills/`. Moving them under `plugin/skills/components/<type>/` groups related skills together for better organization.

## Files to Modify

### Directory Moves (12 skill directories)

| From | To |
|------|-----|
| `plugin/skills/backend-scaffolding/` | `plugin/skills/components/backend/backend-scaffolding/` |
| `plugin/skills/backend-standards/` | `plugin/skills/components/backend/backend-standards/` |
| `plugin/skills/config-scaffolding/` | `plugin/skills/components/config/config-scaffolding/` |
| `plugin/skills/config-standards/` | `plugin/skills/components/config/config-standards/` |
| `plugin/skills/contract-scaffolding/` | `plugin/skills/components/contract/contract-scaffolding/` |
| `plugin/skills/contract-standards/` | `plugin/skills/components/contract/contract-standards/` |
| `plugin/skills/database-scaffolding/` | `plugin/skills/components/database/database-scaffolding/` |
| `plugin/skills/database-standards/` | `plugin/skills/components/database/database-standards/` |
| `plugin/skills/frontend-scaffolding/` | `plugin/skills/components/frontend/frontend-scaffolding/` |
| `plugin/skills/frontend-standards/` | `plugin/skills/components/frontend/frontend-standards/` |
| `plugin/skills/helm-scaffolding/` | `plugin/skills/components/helm/helm-scaffolding/` |
| `plugin/skills/helm-standards/` | `plugin/skills/components/helm/helm-standards/` |

### TypeScript Code

| File | Changes |
|------|---------|
| `plugin/system/src/commands/scaffolding/project.ts` | Update 5 template path references (lines 370-374) to include `components/<type>/` segment |

### Relative Markdown Links Between Skills

These files contain `../skill-name/SKILL.md` relative links that break when the source or target skill moves to a deeper directory.

| File | Links to update |
|------|----------------|
| `plugin/skills/components/backend/backend-standards/SKILL.md` | `../backend-scaffolding/SKILL.md` → `../backend-scaffolding/SKILL.md` (same dir, no change) |
| `plugin/skills/components/backend/backend-scaffolding/SKILL.md` | `../backend-standards/SKILL.md` (no change), `../config-scaffolding/SKILL.md` → `../../config/config-scaffolding/SKILL.md`, `../helm-scaffolding/SKILL.md` → `../../helm/helm-scaffolding/SKILL.md` |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | `../config-standards/SKILL.md` (no change), `../backend-scaffolding/SKILL.md` → `../../backend/backend-scaffolding/SKILL.md`, `../helm-scaffolding/SKILL.md` → `../../helm/helm-scaffolding/SKILL.md` |
| `plugin/skills/components/config/config-standards/SKILL.md` | `../config-scaffolding/SKILL.md` (no change), `../helm-standards/SKILL.md` → `../../helm/helm-standards/SKILL.md`, `../backend-scaffolding/SKILL.md` → `../../backend/backend-scaffolding/SKILL.md` |
| `plugin/skills/components/contract/contract-standards/SKILL.md` | `../contract-scaffolding/SKILL.md` (no change), `../backend-standards/SKILL.md` → `../../backend/backend-standards/SKILL.md` |
| `plugin/skills/components/database/database-standards/SKILL.md` | `../database-scaffolding/SKILL.md` (no change), `../backend-standards/SKILL.md` → `../../backend/backend-standards/SKILL.md` |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | `../backend-scaffolding/SKILL.md` → `../../backend/backend-scaffolding/SKILL.md` |
| `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md` | `../frontend-standards/SKILL.md` (no change) |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | `../helm-standards/SKILL.md` (no change), `../config-scaffolding/SKILL.md` → `../../config/config-scaffolding/SKILL.md`, `../backend-scaffolding/SKILL.md` → `../../backend/backend-scaffolding/SKILL.md` |
| `plugin/skills/components/helm/helm-standards/SKILL.md` | `../helm-scaffolding/SKILL.md` (no change), `../config-scaffolding/SKILL.md` → `../../config/config-scaffolding/SKILL.md`, `../config-standards/SKILL.md` → `../../config/config-standards/SKILL.md`, `../backend-scaffolding/SKILL.md` → `../../backend/backend-scaffolding/SKILL.md` |

Non-component skills referencing component skills (these remain in `plugin/skills/` so their relative paths change differently):

| File | Links to update |
|------|----------------|
| `plugin/skills/scaffolding/SKILL.md` | Template path documentation and directory tree diagram |
| `plugin/skills/cicd-standards/SKILL.md` | Any relative link to helm-standards |
| `plugin/skills/testing-standards/SKILL.md` | Any relative links to backend-standards, frontend-standards |

### Template Path References in Documentation

| File | Path reference to update |
|------|--------------------------|
| `plugin/skills/components/backend/backend-scaffolding/SKILL.md` | `skills/backend-scaffolding/templates/` → `skills/components/backend/backend-scaffolding/templates/` |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | `skills/config-scaffolding/templates/` → `skills/components/config/config-scaffolding/templates/` |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | `skills/contract-scaffolding/templates/` → `skills/components/contract/contract-scaffolding/templates/` |
| `plugin/skills/components/frontend/frontend-scaffolding/SKILL.md` | `skills/frontend-scaffolding/templates/` → `skills/components/frontend/frontend-scaffolding/templates/` |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | `skills/helm-scaffolding/` → `skills/components/helm/helm-scaffolding/` |
| `plugin/skills/scaffolding/SKILL.md` | All 6 template paths in table + directory tree |

### Test Files

| File | Changes |
|------|---------|
| `tests/src/tests/integration/config-component/templates.test.ts` | Update `SKILLS_DIR` path |
| `tests/src/tests/integration/database-component/templates.test.ts` | Update `SKILLS_DIR` path |
| `tests/src/tests/integration/helm-component/templates.test.ts` | Update `SKILLS_DIR` path |
| `tests/src/tests/integration/backend-component/config-integration.test.ts` | Update `SKILLS_DIR` path |
| `tests/src/tests/unit/skills/config-skills.test.ts` | Update 4 path constants |

## Changes

### 1. Move Directories

Use `git mv` for all 12 skill directories to preserve git history.

### 2. Update TypeScript Template Paths

Update `project.ts` to insert `components/<type>/` segment in the 5 template path lookups.

### 3. Update Cross-Skill Relative Links

Fix all `../skill-name/SKILL.md` relative links. Links between skills in the same component type stay the same. Links across component types need `../../<type>/` prefix. Links from non-component skills to component skills need `components/<type>/` prefix.

### 4. Update Documentation Paths

Fix template path strings in scaffolding SKILL.md files and the orchestrator scaffolding skill.

### 5. Update Test Paths

Fix path constants in test files that reference skill directories.

## Dependencies

1. Directory moves must happen first (via git mv)
2. All reference updates can happen in parallel after moves
3. Tests should be run after all updates

## Tests

### Unit Tests
- [ ] `config-skills.test.ts` passes with new paths
- [ ] All existing unit tests pass

### Integration Tests
- [ ] `config-component/templates.test.ts` passes
- [ ] `database-component/templates.test.ts` passes
- [ ] `helm-component/templates.test.ts` passes
- [ ] `backend-component/config-integration.test.ts` passes

## Verification

- [ ] All 12 skill directories exist under `plugin/skills/components/<type>/`
- [ ] No orphan directories remain at `plugin/skills/{type}-{scaffolding,standards}/`
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Plugin manifest unchanged (auto-discovery works)
