---
title: Skills standards audit fixes
created: 2026-02-06
updated: 2026-02-06
---

# Plan: Skills Standards Audit Fixes

## Problem Summary

An audit of all 35 plugin skills against the skills-standards checklist found systemic violations across 7 categories. No skills have input/output schemas, ~106 code blocks lack language tags, 20 skills have self-containment issues, and 3 cross-references point to non-existent skills. This plan addresses all 9 recommended fix priorities from the audit report.

**Important context:** Task #87 (completed 2026-02-06) reorganized component skills into `plugin/skills/components/<type>/<skill>/`. The audit report references the pre-reorganization flat structure. All paths below use the current structure.

## Phases

Work is grouped into 4 phases by effort and risk. Each phase is independently committable.

### Phase 1 — Quick mechanical fixes (P1, P2, P3, P4)

Low-risk, high-volume fixes that can be done with search/replace and templates.

#### P1: Fix 3 broken cross-references (~10 min)

| File | Change |
|------|--------|
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | Remove `api-design` from Related Skills |
| `plugin/skills/components/contract/contract-standards/SKILL.md` | Remove `api-design` from Related Skills |
| `plugin/skills/testing-standards/SKILL.md` | Remove `plugin-testing-standards` from Related Skills (it lives in `.claude/skills/`, not the plugin) |

#### P2: Add language tags to ~106 code blocks (~32 skills)

Audit every `SKILL.md` under `plugin/skills/` for bare ` ``` ` code blocks. Add the appropriate language tag (`yaml`, `typescript`, `bash`, `markdown`, `json`, `text`). Determine language by inspecting block contents — do not guess.

#### P3: Add "no input/output" note to 15 standards-only skills

Add the following section to each standards-only skill that lacks it:

```markdown
## Input / Output

This skill defines no input parameters or structured output.
```

**Affected skills (15):**
`commit-standards`, `testing-standards`, `typescript-standards`, `unit-testing`, `backend-standards`, `cicd-standards`, `config-standards`, `contract-standards`, `database-standards`, `postgresql`, `frontend-standards`, `helm-standards`, `e2e-testing`, `integration-testing`, `local-env`

#### P4: Fix spec-solicitation description

Rewrite frontmatter `description` to remove caller references:
- **Before:** "Guided requirements gathering skill for interactive spec creation. Used for ALL spec creation - both interactive and external spec paths."
- **After:** "Guided requirements gathering through structured questions to create comprehensive specifications. Produces a complete requirements document via non-blocking conversational interaction."

### Phase 2 — Self-containment fixes (P5, S4, body caller references)

Improve cross-reference quality across skills. **This phase requires reading both sides of every cross-reference** to understand the real contract before rewriting. Do not invent contracts — derive them from what each skill actually does.

#### P5: Rewrite Related Skills delegation contracts (13 skills)

Each "Related Skills" section must describe the delegation contract: what goes in, what comes out, where responsibility lives. Rewrite the bare-label lists into contract descriptions.

**Process per skill:**
1. Read the skill's SKILL.md to understand its role
2. Read each referenced skill's SKILL.md to understand what it actually accepts/produces
3. Write the delegation contract describing the real interface between them
4. Do not fabricate contracts — if the interface is unclear, flag it for review

**Affected skills (13):**
`database-standards`, `contract-standards`, `contract-scaffolding`, `config-standards`, `config-scaffolding`, `cicd-standards`, `testing-standards`, `helm-standards`, `helm-scaffolding`, `frontend-scaffolding`, `backend-scaffolding`, `database-scaffolding`, `project-scaffolding`

#### S4: Fix vague "Follow X" / "See X" cross-references (5 skills)

Replace vague cross-references with delegation contracts per the skills-standards GOOD example. Same process as P5 — read both skills before rewriting.

**Affected skills (5):**
`database-standards`, `contract-standards`, `database-scaffolding`, `backend-standards`

#### Remove body caller references (5 scaffolding skills)

Remove "This skill is called by the main scaffolding skill" or similar body text from:
`backend-scaffolding`, `config-scaffolding`, `frontend-scaffolding`, `helm-scaffolding`, `contract-scaffolding`

### Phase 3 — Schema creation (P6, P7)

Create colocated JSON Schema files.

**Critical constraint:** Schemas must match what the skill actually accepts/produces today. Each schema must be derived by reading the skill's full SKILL.md and extracting the real parameters and outputs — not by guessing from section headers. If a skill's input/output is ambiguous, document what's clear and flag the ambiguity.

Many skills already have inline tables or sections describing their inputs/outputs. Convert these to JSON Schema rather than inventing new contracts. Where a skill has an existing inline table, the schema should match it exactly. Where SKILL.md already documents inputs inline, replace that inline documentation with a schema reference (don't keep both — that creates drift).

#### P6: Input/output schemas for process skills (14 skills)

Create `input.schema.json` and/or `output.schema.json` (JSON Schema Draft 2020-12) for each process skill. Add `## Input` / `## Output` sections in `SKILL.md` referencing the schema files with a brief human-readable summary.

**Affected skills (14):**
`change-creation`, `component-discovery`, `domain-population`, `external-spec-integration`, `planning`, `project-scaffolding`, `project-settings`, `scaffolding`, `spec-decomposition`, `spec-index`, `spec-solicitation`, `spec-writing`, `workflow-state`, `epic-planning`

#### P7: Input schemas for scaffolding skills (6 skills)

Create `input.schema.json` for each scaffolding skill defining the config/settings they accept. Scaffolding skills produce files (not structured data), so they generally don't need `output.schema.json`.

**Affected skills (6):**
`backend-scaffolding`, `config-scaffolding`, `contract-scaffolding`, `database-scaffolding`, `frontend-scaffolding`, `helm-scaffolding`

### Phase 4 — Graph cleanup (P8, P9)

#### P8: Resolve informational cycles (6 skills)

For each bilateral cycle between -scaffolding/-standards pairs, pick a canonical direction and remove the reverse reference.

**Direction convention:** Scaffolding skills reference their corresponding standards skill (scaffolding → standards), because scaffolding generates code that must follow the standards. Standards skills should NOT reference scaffolding skills — standards define rules and don't need to know how code is generated.

For cross-scaffolding cycles (e.g. backend-scaffolding <-> config-scaffolding), remove bilateral references and let the parent `scaffolding` skill be the orchestrator that knows about all sub-scaffolding skills.

**Cycles to resolve:**
1. `backend-scaffolding` <-> `backend-standards` → keep scaffolding → standards
2. `config-scaffolding` <-> `config-standards` → keep scaffolding → standards
3. `helm-scaffolding` <-> `helm-standards` → keep scaffolding → standards
4. `backend-scaffolding` <-> `config-scaffolding` → remove both; `scaffolding` orchestrates
5. `backend-scaffolding` <-> `helm-scaffolding` → remove both; `scaffolding` orchestrates
6. `config-scaffolding` <-> `helm-scaffolding` → remove both; `scaffolding` orchestrates

#### P9: Document sdd-system CLI prerequisite (9 skills)

Add a `## Prerequisites` section noting that `sdd-system` CLI must be available and how to invoke it. The audit report body lists 9 skills (the P9 summary said 8 — verify during implementation by grepping for `sdd-system`).

**Affected skills (verify count):**
`spec-index`, `spec-writing`, `domain-population`, `scaffolding`, `config-scaffolding`, `database-scaffolding`, `database-standards`, `helm-scaffolding`, `helm-standards`

## Token Budget

The audit report notes ~96K tokens across all 35 skills. Changes in this task will affect the total:

| Change | Token impact |
|--------|-------------|
| P2: language tags | ~0 (a few chars per block) |
| P3: "no input/output" note | +~150 tokens (15 skills × ~10 tokens) |
| P5/S4: delegation contracts | +~500 tokens (replaces terse labels with 2-3 sentence contracts) |
| P6/P7: `## Input / Output` sections | ~neutral (replaces inline parameter docs with schema references) |
| P9: Prerequisites sections | +~200 tokens (9 skills × ~20 tokens) |
| **Net estimate** | **+~850 tokens (~0.9% increase)** |

Schema `.json` files are separate files loaded on demand, not embedded in SKILL.md — they don't count toward the SKILL.md token budget.

## Files to Modify

| Phase | Files affected | Type of change |
|-------|---------------|----------------|
| 1 | ~35 SKILL.md files | Edit (language tags, broken refs, I/O notes, description) |
| 2 | ~18 SKILL.md files | Edit (rewrite cross-references) |
| 3 | 20 SKILL.md files + ~40 new schema files | Edit + Write |
| 4 | ~14 SKILL.md files | Edit (cycle resolution, prerequisites) |

## Dependencies

- Phase 1 has no dependencies — can start immediately
- Phase 2 has no dependencies on Phase 1, but should come after to avoid edit conflicts
- Phase 3 depends on Phase 2 (delegation contracts inform schema boundaries)
- Phase 4 depends on Phase 2 (cycle resolution changes the same Related Skills sections)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bad delegation contracts mislead LLM about skill boundaries | High — wrong skill loaded or wrong expectations about what skill produces | Read both skills before writing any contract; flag unclear interfaces for review |
| Schemas don't match actual skill behavior | High — creates enforceable lies once #27 validates against them | Derive schemas from existing inline docs; don't invent new parameters |
| Removing cycle back-references loses useful context | Medium — scaffolding skill won't be prompted to check standards | Direction convention (scaffolding → standards) preserves the useful direction |
| Token budget bloat | Low — net increase is <1% | Replace inline docs with schema refs (don't keep both) |

## Tests

### Validation checks (run after each phase)

- [ ] Every `SKILL.md` has exactly 3 frontmatter fields: `name`, `description`, `user-invocable`
- [ ] No `description` field contains caller references ("used by", "called by", "invoked from")
- [ ] Zero bare ` ``` ` code blocks across all plugin skills
- [ ] All 15 standards skills have `## Input / Output` section with "no input/output" note
- [ ] Zero references to `api-design` or `plugin-testing-standards`
- [ ] All Related Skills sections include delegation contracts (not bare labels)
- [ ] No "Follow X" or "See X" without describing what X expects/produces
- [ ] No body text mentioning "called by" or "invoked by"
- [ ] All 20 process/scaffolding skills have colocated `input.schema.json` (and `output.schema.json` where applicable)
- [ ] All schema files are valid JSON and use Draft 2020-12
- [ ] All schema properties include `description`
- [ ] No bilateral cycles in delegation graph
- [ ] All skills referencing `sdd-system` have a Prerequisites section
- [ ] No inline parameter documentation duplicated alongside schema references

### Re-audit

- [ ] Run full audit procedure (skills-standards Audit Procedure) and verify improved scores
- [ ] Summary table shows 35/35 passing for frontmatter, code blocks, schemas
- [ ] Self-containment score improved from 15/35 to 30+/35

## Verification

- [ ] All 9 fix priorities from the audit report are addressed
- [ ] No new violations introduced
- [ ] Re-audit passes with significantly improved scores across all 7 categories
- [ ] Total SKILL.md token budget increase is under 2%
