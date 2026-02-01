---
title: Move sdd-settings.yaml to .sdd/ directory
created: 2026-02-01
updated: 2026-02-01
---

# Plan: Move sdd-settings.yaml to .sdd/ Directory

## Problem Summary

The `sdd-settings.yaml` configuration file currently lives at the project root. This task moves it into `.sdd/sdd-settings.yaml` to consolidate all SDD metadata (settings, checksums, state) into a single directory. This requires updating all references throughout the plugin and ensuring backwards compatibility for existing projects.

## Dependencies

None. This task is independent and can be implemented immediately.

Note: Task #35 (checksumming) and #66 (unified command) will also use `.sdd/`, but there's no conflict - each task adds its own files to the directory.

---

## Complete File Inventory

Based on comprehensive codebase analysis, **26 files** need modification:

### Category 1: Runtime Code (3 files)

These files contain actual TypeScript code that reads/writes the settings file:

| File | Changes Required |
|------|------------------|
| `plugin/system/src/lib/config.ts` | Update `findProjectRoot()` to check `.sdd/sdd-settings.yaml`, add legacy fallback |
| `plugin/system/src/commands/hook/validate-write.ts` | Add `.sdd/` to `SAFE_DIRS`, remove `sdd-settings.yaml` from `SAFE_FILES` |
| `plugin/hooks/recommended-permissions.json` | Add `.sdd/**` patterns, remove root `sdd-settings.yaml` patterns |

### Category 2: Primary Skill (1 file)

This is THE skill that manages the settings file:

| File | Changes Required |
|------|------------------|
| `plugin/skills/project-settings/SKILL.md` | Complete rewrite of path references, add migration guidance, update all operation workflows |

### Category 3: Commands (3 files)

These commands reference the settings file:

| File | Changes Required |
|------|------------------|
| `plugin/commands/sdd-init.md` | Update to create `.sdd/` directory, write to new path |
| `plugin/commands/sdd-new-change.md` | Update path references |
| `plugin/commands/sdd-implement-change.md` | Update path references |

### Category 4: Project Template (1 file) ⚠️ CRITICAL

This template is copied to ALL new projects during `sdd-init`:

| File | Changes Required |
|------|------------------|
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | Update path references - affects all future projects |

### Category 5: Other Skills (8 files)

Skills that reference the settings file path:

| File | Changes Required |
|------|------------------|
| `plugin/skills/planning/SKILL.md` | Update path references |
| `plugin/skills/change-creation/SKILL.md` | Update path references |
| `plugin/skills/commit-standards/SKILL.md` | Update path references |
| `plugin/skills/database-scaffolding/SKILL.md` | Update path references |
| `plugin/skills/contract-scaffolding/SKILL.md` | Update path references |
| `plugin/skills/e2e-testing/SKILL.md` | Update path references |
| `plugin/skills/integration-testing/SKILL.md` | Update path references |
| `plugin/skills/frontend-standards/SKILL.md` | Update path references |

### Category 6: Agents (6 files)

Agent documentation files:

| File | Changes Required |
|------|------------------|
| `plugin/agents/backend-dev.md` | Update path references |
| `plugin/agents/frontend-dev.md` | Update path references |
| `plugin/agents/api-designer.md` | Update path references |
| `plugin/agents/devops.md` | Update path references |
| `plugin/agents/ci-dev.md` | Update path references |
| `plugin/agents/tester.md` | Update path references |

### Category 7: Documentation (2 files)

User-facing docs:

| File | Changes Required |
|------|------------------|
| `docs/getting-started.md` | Update directory tree and path references |
| `docs/components.md` | Update path references |

### Category 8: Tests (2 files)

Test files that create/use settings:

| File | Changes Required |
|------|------------------|
| `tests/src/tests/workflows/sdd-new-change-external-spec.test.ts` | Create `.sdd/` directory, write to new path |
| `tests/src/tests/unit/skills/scaffolding-config.test.ts` | Update path references in test assertions |

---

## Implementation Phases

### Phase 1: Runtime Code + Backwards Compatibility

**Goal:** Make the runtime code work with both paths (new and legacy).

#### 1.1 Update config.ts

```typescript
// Current (line 73):
const sddSettingsPath = path.join(currentDir, 'sdd-settings.yaml');

// New implementation:
const sddSettingsPath = path.join(currentDir, '.sdd', 'sdd-settings.yaml');
const legacySettingsPath = path.join(currentDir, 'sdd-settings.yaml');

// Check new location first, then legacy
if ((await exists(packageJsonPath)) || (await exists(sddSettingsPath))) {
  return currentDir;
}
// Legacy fallback
if (await exists(legacySettingsPath)) {
  console.warn('[SDD] Deprecation warning: sdd-settings.yaml at project root is deprecated. Run /sdd-migrate to move it to .sdd/sdd-settings.yaml');
  return currentDir;
}
```

#### 1.2 Update validate-write.ts

```typescript
// Add to SAFE_DIRS:
'.sdd/',

// Remove from SAFE_FILES:
'sdd-settings.yaml',  // Now covered by .sdd/
```

#### 1.3 Update recommended-permissions.json

```json
{
  "allow": [
    "Write(.sdd/**)",
    "Edit(.sdd/**)",
    // Remove: "Write(sdd-settings.yaml)",
    // Remove: "Edit(sdd-settings.yaml)",
  ]
}
```

**Verification:**
- `npm run build` succeeds
- `findProjectRoot()` finds projects with `.sdd/sdd-settings.yaml`
- `findProjectRoot()` still finds projects with legacy `sdd-settings.yaml` (with warning)
- Hook allows writes to `.sdd/` directory

---

### Phase 2: Primary Skill (project-settings)

**Goal:** Update the main skill that manages the settings file.

Update `plugin/skills/project-settings/SKILL.md`:

1. **File Location section:**
   ```markdown
   ## File Location

   Settings file: `.sdd/sdd-settings.yaml` (git-tracked)

   The `.sdd/` directory contains all SDD metadata. Create this directory if it doesn't exist.
   ```

2. **All operation workflows** - Update paths from `sdd-settings.yaml` to `.sdd/sdd-settings.yaml`

3. **Add migration note:**
   ```markdown
   ## Migration from Legacy Location

   If `sdd-settings.yaml` exists at project root (legacy):
   1. Create `.sdd/` directory
   2. Move `sdd-settings.yaml` to `.sdd/sdd-settings.yaml`
   3. Delete the root file
   4. Commit the change

   Or run: `mkdir -p .sdd && mv sdd-settings.yaml .sdd/ && git add -A && git commit -m "Migrate sdd-settings.yaml to .sdd/"`
   ```

4. **Create operation** - Add step to create `.sdd/` directory if it doesn't exist

**Verification:**
- Skill references only `.sdd/sdd-settings.yaml`
- Migration guidance is clear and actionable

---

### Phase 3: Commands

**Goal:** Update all command files.

#### 3.1 sdd-init.md

- Update Phase 6.1 to create `.sdd/` directory first
- Write settings to `.sdd/sdd-settings.yaml`
- Update checklist item

#### 3.2 sdd-new-change.md

- Update all path references

#### 3.3 sdd-implement-change.md

- Update all path references

**Verification:**
- All command files reference `.sdd/sdd-settings.yaml`
- `sdd-init` creates `.sdd/` directory

---

### Phase 4: Project Template ⚠️ CRITICAL

**Goal:** Update the template that gets copied to new projects.

Update `plugin/skills/project-scaffolding/templates/project/CLAUDE.md`:

1. Update file tree to show `.sdd/sdd-settings.yaml`
2. Update all path references
3. Update the file description table

**This is critical because:**
- This template is copied verbatim to new projects during `sdd-init`
- All future projects will have this file
- Getting it wrong means ALL new projects have incorrect documentation

**Verification:**
- Template references `.sdd/sdd-settings.yaml`
- File tree shows `.sdd/` directory
- Manually inspect the template is correct

---

### Phase 5: Other Skills

**Goal:** Update all skill files that reference the path.

Simple find-and-replace in 8 skill files:
- `sdd-settings.yaml` → `.sdd/sdd-settings.yaml`

Files:
- `plugin/skills/planning/SKILL.md`
- `plugin/skills/change-creation/SKILL.md`
- `plugin/skills/commit-standards/SKILL.md`
- `plugin/skills/database-scaffolding/SKILL.md`
- `plugin/skills/contract-scaffolding/SKILL.md`
- `plugin/skills/e2e-testing/SKILL.md`
- `plugin/skills/integration-testing/SKILL.md`
- `plugin/skills/frontend-standards/SKILL.md`

**Verification:**
- Grep shows no remaining `sdd-settings.yaml` references in skill files (except project-settings migration docs)

---

### Phase 6: Agents

**Goal:** Update all agent documentation.

Simple find-and-replace in 6 agent files:
- `sdd-settings.yaml` → `.sdd/sdd-settings.yaml`

Files:
- `plugin/agents/backend-dev.md`
- `plugin/agents/frontend-dev.md`
- `plugin/agents/api-designer.md`
- `plugin/agents/devops.md`
- `plugin/agents/ci-dev.md`
- `plugin/agents/tester.md`

**Verification:**
- Grep shows no remaining `sdd-settings.yaml` references in agent files

---

### Phase 7: Documentation

**Goal:** Update user-facing docs.

#### 7.1 docs/getting-started.md

Update the directory tree:
```markdown
├── .sdd/
│   └── sdd-settings.yaml    # Project configuration
```

#### 7.2 docs/components.md

Update path references.

**Verification:**
- Docs show correct paths
- No outdated references

---

### Phase 8: Tests

**Goal:** Update tests to use new path.

#### 8.1 sdd-new-change-external-spec.test.ts

```typescript
// Current:
joinPath(testProject.path, 'sdd-settings.yaml'),

// New:
await fs.mkdir(joinPath(testProject.path, '.sdd'), { recursive: true });
joinPath(testProject.path, '.sdd', 'sdd-settings.yaml'),
```

#### 8.2 scaffolding-config.test.ts

Update test assertions and comments.

**Verification:**
- All tests pass
- `npm test` succeeds

---

## Version Bump Decision

**Recommendation: MINOR version bump**

Reasoning:
- This is not a breaking change due to backwards compatibility (legacy path still works)
- It's a new feature (`.sdd/` directory structure)
- Deprecation warning gives users time to migrate

**Do NOT use MAJOR** because existing projects continue to work.

---

## Migration Strategy

### For Existing Projects

When a project has `sdd-settings.yaml` at root (legacy):

1. **Detection:** `findProjectRoot()` finds the legacy file
2. **Warning:** Console warning about deprecation
3. **Continued operation:** Project works normally
4. **User action:** User can migrate when convenient

### Migration Command

Consider adding `/sdd-migrate` command (optional, could be future task):
```bash
mkdir -p .sdd
mv sdd-settings.yaml .sdd/
git add -A
git commit -m "Migrate sdd-settings.yaml to .sdd/"
```

### Deprecation Timeline

- v5.8.0: Introduce `.sdd/` path, legacy still works with warning
- v6.0.0 (future): Remove legacy support

---

## Edge Cases

### 1. `.sdd/` directory already exists

Some projects might have manually created a `.sdd/` directory. Handle gracefully:
- Check if directory exists before creating
- Don't overwrite existing files

### 2. Both paths exist

If both `.sdd/sdd-settings.yaml` AND `sdd-settings.yaml` exist:
- Prefer `.sdd/sdd-settings.yaml` (new location)
- Warn about duplicate file
- Suggest removing the legacy file

### 3. Permission issues

If `.sdd/` can't be created:
- Fail gracefully with clear error message
- Don't fall back to root location for new projects

---

## Verification Checklist

### After Phase 1 (Runtime):
- [ ] `npm run build` succeeds
- [ ] New projects create `.sdd/sdd-settings.yaml`
- [ ] Legacy projects with root file still work
- [ ] Deprecation warning shows for legacy path
- [ ] Hook allows writes to `.sdd/` directory

### After Phase 4 (Template):
- [ ] Template shows `.sdd/sdd-settings.yaml`
- [ ] Manually verified template content is correct

### After Phase 8 (Tests):
- [ ] All tests pass
- [ ] No TypeScript errors

### Final Verification:
- [ ] `grep -r "sdd-settings.yaml" plugin/` only shows:
  - `project-settings/SKILL.md` (migration docs)
  - Backwards compatibility code
- [ ] New project initialization creates correct structure
- [ ] Existing project continues to work

---

## Notes

- The `.sdd/` directory should be git-tracked (unlike `.git/`)
- Future tasks (#35, #66) will add more files to `.sdd/`:
  - `checksums.yaml` for drift detection (#35)
  - `state.yaml` for command session state (#66)
- Consider adding `.sdd/README.md` explaining the directory purpose (optional)
- Task #57 (Add /sdd-settings command) should also be updated to use the new path
