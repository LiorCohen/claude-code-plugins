# Skills Standards Audit — 2026-02-06

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | 34 | 0 | 34 |
| Self-containment | 27 | 7 | 34 |
| Layer separation (CLI ↛ skills) | 31 | 3 | 34 |
| Dependency graph | 34 | 0 | 34 |
| Term definitions | 34 | 0 | 34 |
| Input/Output schemas | 0 | 19 | 19 |
| Code blocks | 34 | 0 | 34 |
| Environment preconditions | 34 | 0 | 34 |

---

## Command → Skill Mapping

| Command | Skills Invoked |
|---------|---------------|
| `/sdd-init` | `project-scaffolding` |
| `/sdd-change` | `workflow-state`, `component-discovery`, `spec-solicitation`, `spec-decomposition`, `external-spec-integration`, `planning` |
| `/sdd-config` | (none — uses `sdd-system` CLI; references `config-scaffolding`, `config-standards`, `helm-standards` for context) |
| `/sdd-settings` | (none — reads/writes `sdd-settings.yaml` directly) |
| `/sdd-run` | (none — wraps `sdd-system` CLI) |

**Notes:**
- `/sdd-change` is the most skill-heavy command, invoking 6 skills directly
- `/sdd-config`, `/sdd-settings`, and `/sdd-run` invoke no skills — they use the `sdd-system` CLI directly
- `/sdd-init` invokes only `project-scaffolding` (which internally delegates to `config-scaffolding` via the `scaffolding` orchestrator)

---

## Agent → Skill Mapping

| Agent | Skills Used |
|-------|-------------|
| `backend-dev` | `typescript-standards`, `backend-standards`, `unit-testing`, `postgresql` |
| `frontend-dev` | `typescript-standards`, `frontend-standards`, `unit-testing` |
| `tester` | `integration-testing`, `e2e-testing` |
| `devops` | `postgresql` |
| `api-designer` | (none) |
| `reviewer` | (none) |
| `db-advisor` | (none) |
| `ci-dev` | (none) |

**Notes:**
- 4 of 8 agents reference no skills at all (`api-designer`, `reviewer`, `db-advisor`, `ci-dev`)
- `typescript-standards` is the most shared skill (used by `backend-dev` and `frontend-dev`)
- `unit-testing` is shared by `backend-dev` and `frontend-dev` (they write unit tests, not the `tester` agent)
- `ci-dev` references no skills despite `cicd-standards` existing — potential gap

### Unreferenced Skills

Skills not directly referenced by any command or agent:

| Skill | How It's Used |
|-------|---------------|
| `change-creation` | Invoked by `planning` and `spec-decomposition` for epic handling |
| `spec-writing` | Consumed by `spec-solicitation` and `component-discovery` |
| `domain-population` | Currently invoked via `sdd-system` CLI (violation — should be invoked by commands/skills instead) |
| `spec-index` | Currently invoked via `sdd-system` CLI (violation — should be invoked by commands/skills instead) |
| `scaffolding` | Currently invoked via `sdd-system` CLI (violation — should be invoked by `/sdd-init` command instead) |
| `backend-scaffolding` | Invoked by `scaffolding` orchestrator |
| `frontend-scaffolding` | Invoked by `scaffolding` orchestrator |
| `contract-scaffolding` | Invoked by `scaffolding` orchestrator |
| `config-scaffolding` | Invoked by `scaffolding` orchestrator |
| `database-scaffolding` | Invoked by `scaffolding` orchestrator |
| `helm-scaffolding` | Invoked by `scaffolding` orchestrator |
| `commit-standards` | Referenced by `cicd-standards` |
| `config-standards` | Referenced by `helm-standards`, `database-standards` |
| `contract-standards` | Standards/reference loaded contextually |
| `database-standards` | Standards/reference loaded contextually |
| `helm-standards` | Standards/reference loaded contextually |
| `cicd-standards` | Standards/reference loaded contextually |
| `testing-standards` | Standards/reference loaded contextually |
| `local-env` | Standards/reference loaded contextually |

---

## Dependency Graph

```
scaffolding -> project-scaffolding
scaffolding -> config-scaffolding
scaffolding -> backend-scaffolding
scaffolding -> frontend-scaffolding
scaffolding -> contract-scaffolding
scaffolding -> database-scaffolding
scaffolding -> helm-scaffolding

external-spec-integration -> component-discovery
external-spec-integration -> spec-decomposition

spec-solicitation -> workflow-state
spec-solicitation -> spec-writing

component-discovery -> spec-writing (output consumed by)

planning -> change-creation (for epics)
spec-decomposition -> change-creation (for epics)

workflow-state -> spec-solicitation (consumer)
workflow-state -> change-creation (consumer)
workflow-state -> external-spec-integration (consumer)

contract-standards -> backend-standards
contract-standards -> frontend-standards

database-standards -> backend-standards
database-standards -> config-standards
database-standards -> helm-standards

database-scaffolding -> postgresql
database-scaffolding -> backend-scaffolding

backend-standards -> backend-scaffolding

cicd-standards -> helm-standards
cicd-standards -> testing-standards
cicd-standards -> commit-standards

helm-standards -> config-standards

testing-standards -> backend-standards
testing-standards -> frontend-standards
```

**Cycles: none**

---

## Systemic Violations

### 1. Schema files at skill root instead of `schemas/` subdirectory (19 skills)

The skills-standards require schema files in a `schemas/` subdirectory:

```
plugin/skills/my-skill/
├── SKILL.md
└── schemas/
    ├── input.schema.json
    └── output.schema.json
```

**All 19 skills with schemas** place them at the skill root level instead:

```
plugin/skills/my-skill/
├── SKILL.md
├── input.schema.json      # WRONG: should be schemas/input.schema.json
└── output.schema.json     # WRONG: should be schemas/output.schema.json
```

Additionally, all 19 skills reference schemas in SKILL.md as `[input.schema.json](./input.schema.json)` instead of `[schemas/input.schema.json](./schemas/input.schema.json)`.

**Affected skills:**
1. component-discovery
2. backend-scaffolding
3. config-scaffolding
4. contract-scaffolding
5. database-scaffolding
6. frontend-scaffolding
7. helm-scaffolding
8. domain-population
9. external-spec-integration
10. planning
11. project-scaffolding
12. project-settings
13. scaffolding
14. spec-decomposition
15. spec-index
16. spec-solicitation
17. spec-writing
18. workflow-state
19. change-creation

### 2. Skills document being invoked by `sdd-system` CLI (3 skills)

The `sdd-system` CLI should never be aware of skills. Skills are a prompt-layer concept consumed by commands and agents — the CLI is a separate system tool. Three skills document CLI invocation of skill logic:

1. **scaffolding** (line 66):
   > `node --enable-source-maps <path-to-plugin>/system/dist/cli.js scaffolding project --config /tmp/sdd-scaffold-config.json`

2. **domain-population** (line 45):
   > `node --enable-source-maps <path-to-plugin>/system/dist/cli.js scaffolding domain --config /tmp/sdd-domain-config.json`

3. **contract-scaffolding** (line 76):
   > `Runs during project creation via sdd-system scaffolding project.`

This couples skills to the CLI implementation, which breaks the separation between prompt-layer skills and system-layer tooling. The CLI may provide underlying operations (file creation, validation, type generation), but it should not route through skill definitions.

### 3. Cross-skill file references (7 skills)

The skills-standards prohibit referencing files inside another skill's directory. Seven skills contain markdown links pointing to other skills' `SKILL.md` files.

**Affected skills:** contract-standards, database-standards, database-scaffolding, backend-standards, scaffolding (template paths in tree diagram)

---

## Per-Skill Violations

### contract-standards

**Cross-skill file references (2 violations):**

1. Line 41:
   > `The [contract-scaffolding](../contract-scaffolding/SKILL.md) skill generates an openapi.yaml...`

2. Line 285:
   > `Server endpoint implementation must follow [backend-standards](../../backend/backend-standards/SKILL.md) — it defines the CMDO handler → orchestrator → repository layering...`

**Fix:** Remove the markdown links. Keep the delegation text but reference skills by name only (backtick-quoted), not by file path. The "Related Skills" section at the bottom of the file already uses the correct delegation contract format.

---

### database-standards

**Cross-skill file references (2 violations):**

1. Line 46:
   > `The [database-scaffolding](../database-scaffolding/SKILL.md) skill generates the initial database structure...`

2. Line 236:
   > `The backend DAL layer must follow [backend-standards](../../backend/backend-standards/SKILL.md) — it defines CMDO architecture...`

**Fix:** Same as contract-standards — remove file path links, keep delegation text with backtick-quoted skill names.

---

### database-scaffolding

**Cross-skill file references (2 violations):**

1. Line 181:
   > `[postgresql](../postgresql/SKILL.md) — Delegate to this for SQL patterns, Docker/K8s deployment...`

2. Line 182:
   > `[backend-scaffolding](../../backend/backend-scaffolding/SKILL.md) — Generates the server component that contains the DAL layer...`

**Fix:** Change `[postgresql](../postgresql/SKILL.md)` to `` `postgresql` `` and `[backend-scaffolding](../../backend/backend-scaffolding/SKILL.md)` to `` `backend-scaffolding` ``. The delegation contract text is already good — just remove the file paths.

---

### backend-standards

**Cross-skill file reference (1 violation):**

1. Line 438:
   > `The [backend-scaffolding](../backend-scaffolding/SKILL.md) skill generates the initial server structure...`

**Fix:** Remove file path link, use backtick-quoted skill name.

---

### scaffolding

**Cross-skill file references (implicit, via template paths):**

Lines 17-23 (Architecture table):
> ```
> | `project-scaffolding` | Root files, specs | `skills/project-scaffolding/templates/` |
> | `config-scaffolding` | Config component (mandatory) | `skills/components/config/config-scaffolding/templates/` |
> ...
> ```

Lines 244-281 (Template Locations tree):
> ```text
> skills/
> ├── project-scaffolding/
> │   ├── SKILL.md
> │   └── templates/
> ...
> ```

These reference internal file structures of other skills' directories. While primarily informational, they create coupling to other skills' internal layout.

**Fix:** Remove the "Templates Location" column from the Architecture table and the full tree diagram. The orchestrator doesn't need to document other skills' internal file layouts — it delegates to them. The CLI handles template path resolution internally.

---

### component-discovery

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### backend-scaffolding

**Schema location:** `input.schema.json` at skill root (should be `schemas/`).

---

### config-scaffolding

**Schema location:** `input.schema.json` at skill root (should be `schemas/`).

---

### contract-scaffolding

**Schema location:** `input.schema.json` at skill root (should be `schemas/`).

**CLI-skills coupling (1 violation):**

Line 76:
> `Runs during project creation via sdd-system scaffolding project.`

Documents being triggered by the CLI's `scaffolding` subcommand. Skills using the CLI is fine, but the CLI invoking skills breaks layer separation.

---

### database-scaffolding

**Schema location:** `input.schema.json` at skill root (should be `schemas/`).

(Also has cross-skill file references listed above.)

---

### frontend-scaffolding

**Schema location:** `input.schema.json` at skill root (should be `schemas/`).

---

### helm-scaffolding

**Schema location:** `input.schema.json` at skill root (should be `schemas/`).

---

### domain-population

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

**CLI-skills coupling (1 violation):**

Line 45:
> `node --enable-source-maps <path-to-plugin>/system/dist/cli.js scaffolding domain --config /tmp/sdd-domain-config.json`

The CLI has a `scaffolding` subcommand that routes to skill logic. Skills using the CLI is fine, but the CLI invoking skills breaks layer separation.

---

### external-spec-integration

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### planning

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### project-scaffolding

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### project-settings

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### scaffolding

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

**CLI-skills coupling (1 violation):**

Line 66:
> `node --enable-source-maps <path-to-plugin>/system/dist/cli.js scaffolding project --config /tmp/sdd-scaffold-config.json`

The CLI has a `scaffolding` subcommand that routes to skill logic. Skills using the CLI is fine, but the CLI invoking skills breaks layer separation.

(Also has cross-skill template path references listed above.)

---

### spec-decomposition

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### spec-index

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### spec-solicitation

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### spec-writing

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### workflow-state

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

### change-creation

**Schema location:** `input.schema.json` and `output.schema.json` at skill root (should be `schemas/`).

---

## Passing Skills (no violations)

The following 15 skills have no violations:

1. **commit-standards** — Correct frontmatter, no schemas (declares "no input/output"), no cross-references
2. **cicd-standards** — Correct frontmatter, proper delegation contracts in Related Skills
3. **config-standards** — Correct frontmatter, no schemas needed, no cross-references
4. **e2e-testing** — Correct frontmatter, no schemas needed, no cross-references
5. **frontend-standards** — Correct frontmatter, no schemas needed, no cross-references
6. **helm-standards** — Correct frontmatter, proper delegation contract for config-standards
7. **integration-testing** — Correct frontmatter, no schemas needed, no cross-references
8. **local-env** — Correct frontmatter, no schemas needed, documents prerequisites
9. **postgresql** — Correct frontmatter, no schemas needed, self-contained SQL reference
10. **testing-standards** — Correct frontmatter, proper delegation contracts in Related Skills
11. **typescript-standards** — Correct frontmatter, no schemas needed, self-contained
12. **unit-testing** — Correct frontmatter, no schemas needed, self-contained
13. **frontend-scaffolding** — Correct frontmatter (schema location is the only issue, listed in systemic)
14. **helm-scaffolding** — Correct frontmatter (schema location is the only issue, listed in systemic)
15. **spec-solicitation** — Correct frontmatter (schema location is the only issue, listed in systemic)

*Note: Skills 13-15 above only fail on the systemic schema location issue — they have no skill-specific violations beyond that.*

---

## Recommended Fix Priority

### Priority 1: Schema location migration (systemic, 19 skills)

**Impact:** High — affects all skills with schemas, blocks schema validation tooling
**Effort:** Low — mechanical file moves + SKILL.md link updates

For each of the 19 affected skills:
1. `mkdir schemas/` in the skill directory
2. `mv input.schema.json schemas/` and `mv output.schema.json schemas/`
3. Update SKILL.md references from `[input.schema.json](./input.schema.json)` to `[schemas/input.schema.json](./schemas/input.schema.json)`
4. Update any build tooling or CLI code that reads schema paths

This should be done as a single bulk commit.

### Priority 2: CLI-skills coupling (3 skills)

**Impact:** High — violates layer separation between prompt-layer skills and system-layer CLI
**Effort:** Medium — requires rearchitecting how scaffolding and domain population are triggered

Skills to fix:
1. **scaffolding** — CLI's `scaffolding project` subcommand routes to skill logic
2. **domain-population** — CLI's `scaffolding domain` subcommand routes to skill logic
3. **contract-scaffolding** — Documents being triggered by CLI's scaffolding subcommand

The CLI should provide primitive operations (file creation, template rendering, validation). Commands and skills should orchestrate those primitives. The `scaffolding` CLI subcommand should either be removed (with commands calling CLI primitives directly) or reframed as a CLI utility that skills happen to call (not the other way around).

### Priority 3: Cross-skill file references (5 skills, 7 violations)

**Impact:** Medium — creates hidden coupling between skills
**Effort:** Low — replace markdown links with backtick-quoted skill names

Skills to fix:
1. **contract-standards** — 2 violations (lines 41, 285)
2. **database-standards** — 2 violations (lines 46, 236)
3. **database-scaffolding** — 2 violations (lines 181, 182)
4. **backend-standards** — 1 violation (line 438)
5. **scaffolding** — Remove template path table column and tree diagram

### Priority 4: scaffolding internal layout documentation

**Impact:** Low — informational coupling, not functional
**Effort:** Low — remove template location details

The scaffolding skill's Architecture table and Template Locations tree document other skills' internal file layouts. Remove these sections to reduce coupling.
