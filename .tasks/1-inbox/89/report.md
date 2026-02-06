# Skills Standards Audit — 2026-02-06

**Scope:** `plugin/skills/**/SKILL.md` (35 skills)
**Standard:** `.claude/skills/skills-standards/SKILL.md`

---

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | 34 | 1 | 35 |
| Self-containment | 15 | 20 | 35 |
| Dependency graph | 29 | 6 | 35 |
| Term definitions | 35 | 0 | 35 |
| Input/Output schemas | 0 | 35 | 35 |
| Code blocks | 3 | 32 | 35 |
| Environment preconditions | 27 | 8 | 35 |

---

## Token Counts per Skill

Approximate tokens = characters / 4. Skills loaded together consume context proportionally.

| Skill | Lines | Words | Chars | ~Tokens |
|-------|------:|------:|------:|--------:|
| change-creation | 1427 | 4975 | 33448 | 8362 |
| workflow-state | 755 | 2681 | 22516 | 5629 |
| spec-decomposition | 645 | 2501 | 19359 | 4840 |
| external-spec-integration | 597 | 2176 | 18446 | 4612 |
| e2e-testing | 613 | 1751 | 16603 | 4151 |
| spec-solicitation | 525 | 2257 | 16359 | 4090 |
| backend-standards | 457 | 2344 | 16950 | 4238 |
| component-discovery | 505 | 2094 | 15781 | 3945 |
| frontend-standards | 548 | 1821 | 14951 | 3738 |
| integration-testing | 547 | 1579 | 14514 | 3629 |
| typescript-standards | 482 | 2010 | 13986 | 3497 |
| spec-writing | 583 | 1883 | 13271 | 3318 |
| planning | 466 | 1782 | 12866 | 3217 |
| postgresql | 549 | 1546 | 12042 | 3011 |
| testing-standards | 404 | 1267 | 10730 | 2683 |
| scaffolding | 281 | 1166 | 9889 | 2472 |
| unit-testing | 396 | 1215 | 9569 | 2392 |
| cicd-standards | 454 | 1106 | 9522 | 2381 |
| helm-standards | 361 | 1028 | 8717 | 2179 |
| project-settings | 258 | 1126 | 8802 | 2201 |
| helm-scaffolding | 258 | 952 | 8297 | 2074 |
| backend-scaffolding | 246 | 825 | 7312 | 1828 |
| contract-standards | 327 | 909 | 7511 | 1878 |
| database-standards | 289 | 971 | 6942 | 1736 |
| commit-standards | 284 | 1028 | 6766 | 1692 |
| config-standards | 231 | 793 | 6606 | 1652 |
| config-scaffolding | 199 | 730 | 5978 | 1495 |
| epic-planning | 249 | 820 | 5885 | 1471 |
| project-scaffolding | 238 | 678 | 5498 | 1375 |
| domain-population | 233 | 614 | 5414 | 1354 |
| frontend-scaffolding | 177 | 561 | 4786 | 1197 |
| database-scaffolding | 174 | 564 | 4581 | 1145 |
| local-env | 181 | 642 | 4437 | 1109 |
| contract-scaffolding | 113 | 400 | 4208 | 1052 |
| spec-index | 152 | 383 | 2996 | 749 |
| **TOTAL** | **14,424** | **50,247** | **385,538** | **~96,384** |

Top 5 skills account for ~28% of total tokens. `change-creation` alone is 8.7%.

---

## Dependency Graph

Directed edges from skill-to-skill references. **Bold** = delegation (skill instructs reader to use another). *Italic* = informational ("Related Skills", "See also").

### Delegation edges

```
scaffolding -> project-scaffolding
scaffolding -> config-scaffolding
scaffolding -> backend-scaffolding
scaffolding -> frontend-scaffolding
scaffolding -> contract-scaffolding
scaffolding -> database-scaffolding
scaffolding -> helm-scaffolding

change-creation -> workflow-state
change-creation -> spec-writing
change-creation -> component-discovery
change-creation -> spec-decomposition
change-creation -> epic-planning
change-creation -> planning

external-spec-integration -> workflow-state
external-spec-integration -> component-discovery
external-spec-integration -> spec-decomposition

spec-solicitation -> workflow-state
spec-solicitation -> spec-writing

planning -> workflow-state
```

### Informational edges ("Related Skills" / "See also")

```
database-standards -> backend-standards
database-standards -> config-standards
database-standards -> helm-standards
database-standards -> database-scaffolding    (See [...])

contract-standards -> backend-standards
contract-standards -> frontend-standards
contract-standards -> api-design               *** BROKEN ***
contract-standards -> contract-scaffolding     (See [...])

contract-scaffolding -> api-design             *** BROKEN ***
contract-scaffolding -> typescript-standards

config-standards -> config-scaffolding
config-standards -> helm-standards
config-standards -> backend-scaffolding

config-scaffolding -> config-standards
config-scaffolding -> backend-scaffolding
config-scaffolding -> helm-scaffolding

backend-scaffolding -> backend-standards
backend-scaffolding -> typescript-standards
backend-scaffolding -> unit-testing
backend-scaffolding -> config-scaffolding
backend-scaffolding -> helm-scaffolding

backend-standards -> backend-scaffolding       (See [...])

frontend-scaffolding -> frontend-standards
frontend-scaffolding -> typescript-standards
frontend-scaffolding -> unit-testing

helm-scaffolding -> helm-standards
helm-scaffolding -> config-scaffolding
helm-scaffolding -> backend-scaffolding

helm-standards -> helm-scaffolding
helm-standards -> config-scaffolding
helm-standards -> config-standards
helm-standards -> backend-scaffolding

cicd-standards -> helm-standards
cicd-standards -> testing-standards
cicd-standards -> commit-standards

testing-standards -> plugin-testing-standards  *** BROKEN (not in plugin/skills/) ***

database-scaffolding -> postgresql
database-scaffolding -> backend-scaffolding

project-scaffolding -> config-scaffolding
project-scaffolding -> backend-scaffolding
project-scaffolding -> frontend-scaffolding
project-scaffolding -> database-scaffolding
```

### Cycles (informational edges)

All cycles are between -scaffolding and -standards pairs or between scaffolding skills. None occur in delegation edges.

| Cycle | Path |
|-------|------|
| 1 | `backend-scaffolding` <-> `backend-standards` |
| 2 | `config-scaffolding` <-> `config-standards` |
| 3 | `helm-scaffolding` <-> `helm-standards` |
| 4 | `backend-scaffolding` <-> `config-scaffolding` |
| 5 | `backend-scaffolding` <-> `helm-scaffolding` |
| 6 | `config-scaffolding` <-> `helm-scaffolding` |
| 7 | `backend-scaffolding` -> `config-scaffolding` -> `helm-scaffolding` -> `backend-scaffolding` (triangle) |

Skills in at least one cycle: `backend-scaffolding`, `backend-standards`, `config-scaffolding`, `config-standards`, `helm-scaffolding`, `helm-standards` (6 skills).

### Broken references

| Source skill | Target | Issue |
|-------------|--------|-------|
| contract-scaffolding | `api-design` | Skill does not exist in `plugin/skills/` |
| contract-standards | `api-design` | Skill does not exist in `plugin/skills/` |
| testing-standards | `plugin-testing-standards` | Exists in `.claude/skills/`, not `plugin/skills/` |

---

## Systemic Violations

Issues affecting 5+ skills. Address as bulk fixes.

### S1. No input/output schema files (35/35 skills)

**Zero** skills have colocated `input.schema.json` or `output.schema.json` files. **Zero** standards-only skills include the required "This skill defines no input parameters or structured output" note.

The standard requires:
- Skills with parameters/output: colocated JSON Schema files (Draft 2020-12)
- Standards-only skills: explicit `## Input / Output` section noting no schemas needed

**Affected:** All 35 skills.

**Split by type:**

| Type | Count | Action needed |
|------|-------|---------------|
| Process skills (accept input, produce output) | 14 | Add `input.schema.json` and/or `output.schema.json` |
| Standards/guidelines skills | 15 | Add `## Input / Output` noting "no input/output" |
| Scaffolding skills (accept config, produce files) | 6 | Add `input.schema.json` |

Process skills needing schemas: `change-creation`, `component-discovery`, `domain-population`, `external-spec-integration`, `planning`, `project-scaffolding`, `project-settings`, `scaffolding`, `spec-decomposition`, `spec-index`, `spec-solicitation`, `spec-writing`, `workflow-state`, `epic-planning`.

Scaffolding skills needing input schema: `backend-scaffolding`, `config-scaffolding`, `contract-scaffolding`, `database-scaffolding`, `frontend-scaffolding`, `helm-scaffolding`.

Standards skills needing "no input/output" note: `commit-standards`, `testing-standards`, `typescript-standards`, `unit-testing`, `backend-standards`, `cicd-standards`, `config-standards`, `contract-standards`, `database-standards`, `postgresql`, `frontend-standards`, `helm-standards`, `e2e-testing`, `integration-testing`, `local-env`.

### S2. Code blocks without language specifier (~32/35 skills)

The standard requires: "Code blocks — Always specify language." Many skills have code blocks opened with bare ` ``` ` instead of ` ```yaml `, ` ```typescript `, etc. Estimated ~106 code blocks across 32 skills lack a language tag.

**Only 3 skills have all code blocks tagged:** `spec-index`, `local-env`, `postgresql`.

**Worst offenders (estimated unlanguaged blocks):**

| Skill | ~Unlanguaged blocks |
|-------|--------------------:|
| commit-standards | 11 |
| change-creation | 11 |
| backend-standards | 8 |
| spec-solicitation | 8 |
| spec-writing | 6 |
| external-spec-integration | 6 |
| backend-scaffolding | 5 |

### S3. "Related Skills" sections lack delegation contracts (13/35 skills)

13 skills have a `## Related Skills` section that lists skill names with brief labels but does not describe the delegation contract (what goes in, what comes out, where responsibility lives).

> **BAD (typical):**
> ```
> ## Related Skills
> - `backend-standards` - DAL layer that queries the database
> - `config-standards` - Database config management
> ```

> **GOOD (per standard):**
> ```
> ## Related Skills
> - `backend-standards` — Delegate to this for DAL implementation patterns.
>   Expects a database component name; provides query patterns, connection
>   pooling rules, and typed result mapping.
> ```

**Affected:** `database-standards`, `contract-standards`, `contract-scaffolding`, `config-standards`, `config-scaffolding`, `cicd-standards`, `testing-standards`, `helm-standards`, `helm-scaffolding`, `frontend-scaffolding`, `backend-scaffolding`, `database-scaffolding`, `project-scaffolding`.

### S4. Vague "Follow X" / "See X" cross-references (5 skills)

Some cross-references use the BAD pattern explicitly called out in the standard:

| Skill | Quoted violation |
|-------|-----------------|
| database-standards | `"Follow [backend-standards](...) for DAL layer."` |
| contract-standards | `"Follow [backend-standards](...) implementation order."` |
| database-scaffolding | `"Follow patterns from the [postgresql skill](...)"` |
| backend-standards | `"See [backend-scaffolding](...) for the minimal config schema generated when scaffolding"` |
| database-standards | `"See [database-scaffolding](...) for the minimal config schema generated when scaffolding"` |

These tell the reader to go read another skill without describing what it expects or produces.

### S5. `sdd-system` CLI assumed without documentation (8 skills)

8 skills reference `sdd-system` CLI commands without documenting that the CLI must be available or how to access it:

**Affected:** `spec-index`, `spec-writing`, `domain-population`, `scaffolding`, `config-scaffolding`, `database-scaffolding`, `database-standards`, `helm-scaffolding`, `helm-standards`.

---

## Per-Skill Violations

Only skills with violations beyond the systemic issues above.

### spec-solicitation

- **Frontmatter description references callers:** `"Used for ALL spec creation - both interactive and external spec paths."` — describes where/when the skill is used, violating "Never reference where or when the skill is used."

### contract-scaffolding

- **Broken cross-reference:** `"api-design - API design patterns and conventions"` — `api-design` does not exist in `plugin/skills/`.

### contract-standards

- **Broken cross-reference:** `"api-design - API design patterns and best practices"` — `api-design` does not exist in `plugin/skills/`.

### testing-standards

- **Broken cross-reference:** `"plugin-testing-standards - Additional testing methodology"` — `plugin-testing-standards` exists in `.claude/skills/` (repo's own skills), not `plugin/skills/` (plugin skills).

### backend-scaffolding, config-scaffolding, frontend-scaffolding, helm-scaffolding, contract-scaffolding

- **Body references caller:** Each contains `"This skill is called by the main scaffolding skill"` (or similar). While the frontmatter description doesn't reference callers, the body does. The self-containment rule says "the skill doesn't know its callers" — this is a minor violation in the body text (not the description field).

---

## Recommended Fix Priority

Ordered by impact and effort. High impact / low effort first.

### Priority 1 — Broken references (3 skills, ~10 min)

Fix the 3 broken cross-references that point to non-existent skills:
1. Remove `api-design` from `contract-scaffolding` and `contract-standards` Related Skills (or create the skill)
2. Remove `plugin-testing-standards` from `testing-standards` Related Skills (or inline the needed content)

### Priority 2 — Code block language tags (~32 skills, ~2 hrs)

Add language specifiers to ~106 unlanguaged code blocks. Most are `yaml`, `bash`, `typescript`, or `markdown` blocks. Can be done with a bulk regex search/replace.

### Priority 3 — "No input/output" note for standards skills (15 skills, ~30 min)

Add `## Input / Output\n\nThis skill defines no input parameters or structured output.` to the 15 standards-only skills. Mechanical fix.

### Priority 4 — Description fix for spec-solicitation (1 skill, ~5 min)

Rewrite description to remove caller references:
- **Before:** `"Guided requirements gathering skill for interactive spec creation. Used for ALL spec creation - both interactive and external spec paths. Uses non-blocking conversational interaction."`
- **After:** `"Guided requirements gathering through structured questions to create comprehensive specifications. Produces a complete requirements document via non-blocking conversational interaction."`

### Priority 5 — Related Skills delegation contracts (13 skills, ~2 hrs)

Rewrite "Related Skills" sections to describe delegation contracts (what goes in, what comes out, where responsibility lives) per the GOOD example in the standard.

### Priority 6 — Input/output schema files for process skills (14 skills, ~8 hrs)

Create colocated `input.schema.json` and `output.schema.json` files using JSON Schema Draft 2020-12. Many skills already have inline Input/Output tables that can be mechanically converted.

### Priority 7 — Input schema files for scaffolding skills (6 skills, ~3 hrs)

Create `input.schema.json` for each scaffolding skill defining the config/settings they accept.

### Priority 8 — Resolve informational cycles (6 skills, ~1 hr)

The bilateral cycles between -scaffolding/-standards pairs are informational, not delegation. To resolve:
- Pick a direction (standards -> scaffolding, or scaffolding -> standards)
- Remove the reverse reference or convert it to a delegation contract with clear directionality

### Priority 9 — Document sdd-system CLI prerequisite (8 skills, ~30 min)

Add a `## Prerequisites` section or note that `sdd-system` CLI must be available and how to invoke it.
