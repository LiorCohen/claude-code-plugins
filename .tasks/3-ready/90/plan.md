---
title: Fix skills standards violations from audit report
created: 2026-02-07
---

# Plan: Fix Skills Standards Violations

## Problem Summary

The skills audit (#89) identified three categories of standards violations across the plugin's skills:

1. **Schema files at root level** — 19 skills have `input.schema.json`/`output.schema.json` at skill root instead of `schemas/` subdirectory
2. **Cross-skill file references** — 5 skills contain markdown links pointing into other skills' directories (7 violations)
3. **CLI-to-skill coupling** — 3 skills document being invoked by the `sdd-system` CLI, breaking layer separation

## Files to Modify

| File | Changes |
|------|---------|
| 19 skill directories | Create `schemas/` subdirectory, move `*.schema.json` into it (32 files total) |
| 19 SKILL.md files | Update 32 schema reference links from `./input.schema.json` to `./schemas/input.schema.json` |
| `components/contract/contract-standards/SKILL.md` | Remove 2 cross-skill file links (lines 41, 285) |
| `components/database/database-standards/SKILL.md` | Remove 2 cross-skill file links (lines 46, 236) |
| `components/database/database-scaffolding/SKILL.md` | Remove 2 cross-skill file links (lines 181, 182) |
| `components/backend/backend-standards/SKILL.md` | Remove 1 cross-skill file link (line 438) |
| `scaffolding/SKILL.md` | Remove template paths column from Architecture table (lines 15-23) + tree diagram section (lines 241-282); reword CLI invocation (line 66) |
| `domain-population/SKILL.md` | Reword CLI invocation (line 45) |
| `components/contract/contract-scaffolding/SKILL.md` | Reword CLI invocation (line 76) |
| `.claude/skills/skills-standards/SKILL.md` | Update consumer reference: remove "(violation)" annotations from lines 315-317 |

## Changes

### 1. Schema file migration (19 skills, 32 files)

Move all `input.schema.json` and `output.schema.json` files from skill root into a `schemas/` subdirectory. Update all SKILL.md references accordingly.

**File counts:**
- 13 skills with both input + output schemas (26 files): change-creation, component-discovery, domain-population, external-spec-integration, planning, project-scaffolding, project-settings, scaffolding, spec-decomposition, spec-index, spec-solicitation, spec-writing, workflow-state
- 6 skills with input schema only (6 files): backend-scaffolding, config-scaffolding, contract-scaffolding, database-scaffolding, frontend-scaffolding, helm-scaffolding

**SKILL.md reference update pattern (32 references across 19 files):**
```
# Before
Schema: [`input.schema.json`](./input.schema.json)
Schema: [`output.schema.json`](./output.schema.json)

# After
Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)
Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)
```

**No TypeScript or test code changes needed.** Verified: the system layer never references skill `input.schema.json`/`output.schema.json` files. These are prompt-layer artifacts consumed by the LLM. The `config.schema.json` references in tests are for the config component runtime (separate concern, already in a `schemas/` subdirectory inside templates).

### 2. Cross-skill file reference removal (5 skills, 7 violations)

Replace markdown links pointing to other skills' `SKILL.md` files with backtick-quoted skill names. The surrounding delegation text stays — only the link syntax changes.

**Exact violations:**

| Skill | Line | Current | Replacement |
|-------|------|---------|-------------|
| `contract-standards` | 41 | `[contract-scaffolding](../contract-scaffolding/SKILL.md)` | `` `contract-scaffolding` `` |
| `contract-standards` | 285 | `[backend-standards](../../backend/backend-standards/SKILL.md)` | `` `backend-standards` `` |
| `database-standards` | 46 | `[database-scaffolding](../database-scaffolding/SKILL.md)` | `` `database-scaffolding` `` |
| `database-standards` | 236 | `[backend-standards](../../backend/backend-standards/SKILL.md)` | `` `backend-standards` `` |
| `database-scaffolding` | 181 | `[postgresql](../postgresql/SKILL.md)` | `` `postgresql` `` |
| `database-scaffolding` | 182 | `[backend-scaffolding](../../backend/backend-scaffolding/SKILL.md)` | `` `backend-scaffolding` `` |
| `backend-standards` | 438 | `[backend-scaffolding](../backend-scaffolding/SKILL.md)` | `` `backend-scaffolding` `` |

**`scaffolding/SKILL.md` — template path references (2 sections):**

1. **Architecture table (lines 15-23):** Remove the "Templates Location" column. The orchestrator delegates to sub-skills — it doesn't need to document their internal file layouts.

2. **Tree diagram (lines 241-282):** Remove the entire "Templates are colocated with their scaffolding skills:" paragraph and tree diagram. This documents other skills' internal directory structures.

**Not a violation:** `spec-writing/SKILL.md` line 221 contains `[Definition](../../domain/definitions/definition.md)` — this is inside a spec template example showing what generated output looks like, not a reference to another skill's files.

### 3. CLI-to-skill coupling fixes (3 skills)

The skills-standards rule (line 229): "A skill may document calling the CLI. A skill must never document being invoked by the CLI."

These 3 skills document the CLI routing **to** them (violation), not calling the CLI as a tool:

- **`scaffolding/SKILL.md`** (line 66): `node --enable-source-maps <path-to-plugin>/system/dist/cli.js scaffolding project --config ...` — The skill documents being invoked via the CLI's `scaffolding project` subcommand. Reword to describe what the skill orchestrates and how commands should invoke it.

- **`domain-population/SKILL.md`** (line 45): `node --enable-source-maps <path-to-plugin>/system/dist/cli.js scaffolding domain --config ...` — Same pattern. Reword to describe the domain population operation abstractly.

- **`contract-scaffolding/SKILL.md`** (line 76): `Runs during project creation via sdd-system scaffolding project.` — Documents being triggered by the CLI. Reword to describe when scaffolding produces contract component files, without referencing the CLI routing.

**Not violations (skills calling CLI — correct direction):**
- `spec-index/SKILL.md` — documents calling `sdd-system spec validate/index/snapshot` (fine)
- `spec-writing/SKILL.md` — documents calling `sdd-system spec validate` (fine)
- `contract-scaffolding/SKILL.md` lines 55-56 — documents calling `sdd-system contract generate-types/validate` (fine)
- `database-scaffolding/SKILL.md` — documents calling `sdd-system database setup/migrate/seed` (fine)
- Various other skills document `sdd-system` as a prerequisite (fine)

### 4. Skills-standards consumer reference cleanup

After fixing the 3 CLI coupling violations, update the consumer reference in `.claude/skills/skills-standards/SKILL.md` lines 315-317 to remove the "(violation — CLI should not invoke skills)" annotations:

```markdown
# Before
- `domain-population` — currently invoked via `sdd-system` CLI (violation — CLI should not invoke skills)
- `spec-index` — currently invoked via `sdd-system` CLI (violation — CLI should not invoke skills)
- `scaffolding` — currently invoked via `sdd-system` CLI (violation — CLI should not invoke skills)

# After (describe actual invocation path post-fix)
- `domain-population` — invoked by `project-scaffolding` for initial domain spec creation
- `spec-index` — invoked by commands for spec indexing and validation
- `scaffolding` — invoked by `/sdd-init` for project creation
```

## Dependencies

No sequencing requirements between the three violation categories — they are independent. Within each category, all changes are independent.

## Tests

### Unit Tests

- [ ] `test_all_skill_schemas_in_subdirectory` — verify no `*.schema.json` at any skill root (only in `schemas/`)
- [ ] `test_skill_md_schema_references_use_schemas_prefix` — verify all SKILL.md schema links use `./schemas/` path
- [ ] `test_no_cross_skill_file_references` — verify no SKILL.md contains `](../` links to another skill's SKILL.md
- [ ] `test_no_cli_to_skill_invocation` — verify no SKILL.md documents being invoked by `sdd-system` (regex: `via.*sdd-system` or `cli.js.*scaffolding`)
- [ ] `test_skills_standards_no_violation_annotations` — verify consumer reference section has no "(violation" text

### Integration Tests

- [ ] `test_build_plugin_succeeds` — `npm run build:plugin` passes
- [ ] `test_suite_passes` — `npm test` passes (existing tests unaffected — verified no tests reference skill schema files)

## Verification

- [ ] No `*.schema.json` files at any skill root (only in `schemas/` subdirectories)
- [ ] No markdown links between skills' SKILL.md files (only backtick-quoted names)
- [ ] No `cli.js scaffolding` or `via sdd-system scaffolding` in skill SKILL.md files
- [ ] Skills-standards consumer reference has no "(violation)" annotations
- [ ] Build and tests pass
