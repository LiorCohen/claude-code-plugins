# Agents Standards Audit — 2026-02-07

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | 8 | 0 | 8 |
| Self-containment | 5 | 3 | 8 |
| User interaction (direct) | 8 | 0 | 8 |
| User interaction (transitive) | 8 | 0 | 8 |
| Skill references | 6 | 2 | 8 |
| Staleness | 6 | 2 | 8 |
| Inter-agent consistency | 6 | 2 | 8 |
| Structure | 4 | 4 | 8 |

---

## Staleness Report

All skill references were validated using a recursive glob (`plugin/skills/**/SKILL.md`). Skills may live in nested directories (e.g. `plugin/skills/components/backend/backend-standards/`).

### Skill Existence Results

| Skill Referenced | Agent(s) | Exists | Location |
|-----------------|----------|--------|----------|
| `typescript-standards` | `backend-dev`, `frontend-dev` | Yes | `plugin/skills/typescript-standards/` |
| `backend-standards` | `backend-dev` | Yes | `plugin/skills/components/backend/backend-standards/` |
| `unit-testing` | `backend-dev`, `frontend-dev` | Yes | `plugin/skills/unit-testing/` |
| `frontend-standards` | `frontend-dev` | Yes | `plugin/skills/components/frontend/frontend-standards/` |
| `integration-testing` | `tester` | Yes | `plugin/skills/components/integration-testing/integration-testing/` |
| `e2e-testing` | `tester` | Yes | `plugin/skills/components/e2e-testing/e2e-testing/` |
| `postgresql` | `backend-dev` (inline), `devops` (inline) | Yes | `plugin/skills/components/database/postgresql/` |

**All referenced skills exist.** No phantom references found.

### Inline vs Formal References

| Agent | Skill | Issue |
|-------|-------|-------|
| `backend-dev` | `postgresql` | Referenced inline at line 39 ("See `postgresql` skill for SQL patterns") but NOT listed in `## Skills` section |
| `devops` | `postgresql` | Referenced inline at line 189 ("See `postgresql` skill for SQL patterns") but agent has no `## Skills` section at all |

These inline references work at runtime (the model can still load the skill) but they violate the convention of listing all referenced skills in the `## Skills` section for discoverability and audit.

---

## User Interaction Violations (Direct)

Regex scan for: `ask the user`, `confirm with`, `user preference`, `prompt the user`, `wait for`, `the user should`, `check with the user` (case-insensitive).

**Result: No violations found.** All 8 agents are clean.

## User Interaction Violations (Transitive)

Scanned all skills referenced by agents: `typescript-standards`, `backend-standards`, `unit-testing`, `frontend-standards`, `integration-testing`, `e2e-testing`, `postgresql`.

**Result: No violations found.** All referenced skills are interaction-free.

---

## Consumer Reference Sync

Cross-checking agent files against the Agents → Skills table in `skills-standards` (lines 298-308):

### skills-standards says:

| Agent | Skills Listed |
|-------|-------------|
| `backend-dev` | `typescript-standards`, `backend-standards`, `unit-testing`, `postgresql` |
| `frontend-dev` | `typescript-standards`, `frontend-standards`, `unit-testing` |
| `tester` | `integration-testing`, `e2e-testing` |
| `devops` | `postgresql` |
| `api-designer` | (none) |
| `reviewer` | (none) |
| `db-advisor` | (none) |
| `ci-dev` | (none) |

### Mismatches:

| Agent | Issue |
|-------|-------|
| `backend-dev` | **Consumer reference lists `postgresql`** but agent file only mentions it inline at line 39 ("See `postgresql` skill for SQL patterns"), not in the `## Skills` section. The `## Skills` section lists `typescript-standards`, `backend-standards`, `unit-testing`. |
| `devops` | **Consumer reference lists `postgresql`** but agent file has no `## Skills` section at all. `postgresql` is only mentioned inline at line 189 ("See `postgresql` skill for SQL patterns"). |

---

## Per-Agent Violations

### `api-designer` — 1 violation

**Self-containment: Uses "backend-dev" as implicit knowledge.**
> Line 69: `- Is used by backend-dev to name controller handlers`
> Line 81: `operationId: createUser  # REQUIRED - becomes handleCreateUser() in controller`

This references `backend-dev`'s internal convention (`handleCreateUser()`) without framing it as a delegation contract. The reader must know how `backend-dev` uses `operationId` to understand why the naming matters.

**Verdict:** 1 self-containment violation (implicit cross-agent knowledge).

---

### `backend-dev` — 2 violations

1. **Skill reference: `postgresql` is referenced inline but not in `## Skills` section.**
   > Line 39: `4. See \`postgresql\` skill for SQL patterns and best practices`

   The skill is mentioned in the body but not listed under `## Skills` (lines 14-17).

2. **Consumer reference mismatch:** `skills-standards` lists `postgresql` as a skill for this agent, but the agent's `## Skills` section doesn't include it.

**Verdict:** 1 informal skill reference, 1 consumer reference desync.

---

### `frontend-dev` — 1 violation

1. **Self-containment: Rules section delegates without contract.**
   > Line 84: `Follow all rules defined in the \`typescript-standards\` and \`frontend-standards\` skills.`

   This is a vague delegation — the reader doesn't know what those rules are or what contract to expect. Compare with the `## Skills` section at line 15 which does include summaries.

**Verdict:** 1 vague delegation.

---

### `tester` — 0 violations

All checks pass. Skills `integration-testing` and `e2e-testing` both exist (at nested paths). Structure is correct. No user interaction.

**Verdict:** Clean.

---

### `devops` — 3 violations

1. **Structure: No `## Skills` section.** The consumer reference in `skills-standards` lists `postgresql` as a skill for this agent, but the agent has no `## Skills` section. The skill is only mentioned inline:
   > Line 189: `- See \`postgresql\` skill for SQL patterns`

2. **Consumer reference mismatch:** `skills-standards` lists `postgresql` but agent has no formal `## Skills` section.

3. **Structure: No `## Working Directory` section.** The agent operates on `components/helm_charts/` but doesn't have a clearly labeled `## Working Directory` section — the working directory is embedded within the body content.

**Verdict:** 2 structural issues, 1 consumer reference desync.

---

### `reviewer` — 1 violation

1. **Structure: "Sub-Reviews" section uses non-standard heading for agent delegation.**
   > Line 12: `## Sub-Reviews`
   > Line 15: `- \`db-advisor\` for database schema, migrations, or query changes`

   The delegation contract is minimal but sufficient — the reader knows when to invoke `db-advisor` and what domain it covers. However, `## Sub-Reviews` is not a standard section name per agents-standards structure.

**Verdict:** 1 structural (non-standard section name).

---

### `db-advisor` — 1 violation

1. **Self-containment: `## Role` section references callers.**
   > Line 14-16:
   > `Advisory only. Invoked by:`
   > `- \`reviewer\` agent during code review`
   > `- Explicitly when database changes are planned`

   Per agents-standards: "Never reference when or by whom the agent is invoked — the agent doesn't know its callers." The description field is clean, but the body violates this by listing who invokes it.

**Verdict:** 1 self-containment violation (lists callers).

---

### `ci-dev` — 0 violations

All checks pass. No skills referenced (consistent with consumer reference). Structure is correct. No user interaction. No self-containment issues.

**Verdict:** Clean.

---

## Recommended Fix Priority

### High (standards compliance)

1. **Add `postgresql` to `backend-dev` `## Skills` section** — The skill exists and is referenced inline. Formalize it.
2. **Add `## Skills` section to `devops`** — Add `postgresql` formally. The skill exists at `plugin/skills/components/database/postgresql/`.
3. **Remove caller references from `db-advisor`** — Delete the "Invoked by" list from `## Role` section. The agent doesn't need to know its callers.

### Medium (structural consistency)

4. **Fix `api-designer` cross-agent reference** — Rephrase line 69 to explain the naming convention without referencing `backend-dev`'s internal behavior.
5. **Fix `frontend-dev` vague delegation** — Line 84 should either be removed (skills are already listed in `## Skills`) or rephrased with contract.
6. **Standardize `reviewer`'s `## Sub-Reviews` section** — Rename or restructure agent delegation for consistency.
7. **Add `## Working Directory` to `devops`** — Extract from body into labeled section.

### Low (polish)

8. **Update consumer reference table in `skills-standards`** — Sync after fixing agent files. Ensure `backend-dev` and `devops` both list `postgresql` in their `## Skills` sections to match the table.
