---
title: Merge ci-dev agent into devops agent
created: 2026-02-07
updated: 2026-02-07
---

# Plan: Merge ci-dev agent into devops agent

## Problem Summary

The `ci-dev` and `devops` agents have significant overlap — both deal with Testkube, build pipelines, and deployment. Merging `ci-dev` into `devops` simplifies the agent roster and eliminates the unclear boundary between "infrastructure" and "CI/CD pipelines".

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/agents/devops.md` | Add CI/CD pipeline sections from ci-dev, update description, add `## Working Directory`, add `## Skills` section |
| `plugin/agents/ci-dev.md` | Delete |
| `docs/agents.md` | Remove ci-dev section, update devops section, fix agent count, update model table |
| `README.md` | Remove ci-dev row from agent table, update "8 specialized agents" → "7 specialized agents" |
| `.claude-plugin/marketplace.json` | Update description: "10 specialized AI agents" → correct count |

### Files NOT modified (and why)

| File | Reason |
|------|--------|
| `plugin/skills/change-creation/SKILL.md` | Does not reference ci-dev (references `devops` for helm component, which stays) |
| `plugin/skills/planning/SKILL.md` | Does not reference ci-dev (references `devops` for helm component, which stays) |
| `changelog/v1.md`, `changelog/v5.md` | Historical records — not modified |
| `.tasks/1-inbox/91/report.md` | Audit report — becomes partially obsolete (this merge fixes some #91 violations). Not modified; #91 can be re-audited. |
| `tests/src/tests/integration/database-component/scaffolding-integration.test.ts` | Only tests `devops.md` and `backend-dev.md` — no ci-dev references. Tests will still pass since `devops.md` retains all existing content. |

## Changes

### 1. Merge ci-dev content into devops.md

Update the devops agent to absorb ci-dev responsibilities:

- **Description frontmatter**: Add CI/CD pipelines, GitHub Actions, and PR checks
- **Role statement**: Expand to include CI/CD expertise
- **Add `## Skills`**: Formalize the `postgresql` skill reference (fixes Task #91 violation)
- **Add `## Working Directory`**: `components/helm_charts/`, `.github/workflows/`, and Kubernetes manifests (fixes Task #91 violation)
- **Add CI/CD sections**:
  - **Test Execution Strategy** table (unit tests in CI runner vs Testkube)
  - **Pipeline Architecture** with PR Check pipeline example
  - **Workflows to Maintain** table (PR Check, Main Build, Deploy, Security Scan)
- **Update Responsibilities**: Add CI/CD pipeline items (maintain GitHub Actions workflows, configure PR checks, build automation)
- **Merge into Rules**: Add ci-dev rules (unit tests in CI runner for fast feedback, build once deploy many, ephemeral namespaces for PR testing, clean up test namespaces after runs)
- **Deduplicate**: Both agents mention Testkube — ci-dev's test execution strategy merges into the existing Testkube Setup section without duplication

### 2. Delete ci-dev.md

Remove `plugin/agents/ci-dev.md`.

### 3. Update docs/agents.md

- Remove the `### ci-dev` section (lines 77-83)
- Update `### devops` description: "Handles infrastructure" → "Handles infrastructure and CI/CD pipelines"
- Update `### devops` "What it does" to include GitHub Actions, PR checks
- Update agent model table: remove `ci-dev` from Implementation row
- The doc says "SDD uses specialized agents" (no hardcoded count) — verify no count to fix

### 4. Update README.md

- Remove the `| ci-dev | sonnet | CI/CD pipelines |` row from the agent table
- Update "SDD uses 8 specialized agents" → "SDD uses 7 specialized agents"
- Update devops row description: "Kubernetes, Helm, Testkube" → "Kubernetes, Helm, CI/CD, Testkube"

### 5. Update .claude-plugin/marketplace.json

- Update description: "10 specialized AI agents" → "7 specialized AI agents" (current actual count after merge: api-designer, backend-dev, frontend-dev, db-advisor, devops, tester, reviewer)

### 6. No changes to changelogs or task reports

Changelogs (`changelog/v1.md`, `changelog/v5.md`) are historical records. Task reports (`.tasks/1-inbox/91/report.md`, `.tasks/6-complete/90/report.md`) reference ci-dev but are archival artifacts — not modified.

## Tests

Existing tests that touch agents:

| Test | Impact |
|------|--------|
| `tests/.../scaffolding-integration.test.ts` — `devops.md references database component` | **Safe** — devops.md retains all database content |
| `tests/.../scaffolding-integration.test.ts` — `devops.md mentions database deployment strategies` | **Safe** — devops.md retains StatefulSet, migrations, PostgreSQL content |

No tests reference `ci-dev.md` directly. No tests enumerate agent count. Run `npm test` to confirm nothing breaks.

## Verification

- [ ] `plugin/agents/ci-dev.md` no longer exists
- [ ] `plugin/agents/devops.md` includes CI/CD pipeline content (Pipeline Architecture, Workflows to Maintain, Test Execution Strategy)
- [ ] `devops.md` has `## Skills` section with `postgresql` reference
- [ ] `devops.md` has `## Working Directory` section
- [ ] `devops.md` follows agent structure: role statement → Skills → Working Directory → core sections → Rules (last)
- [ ] `devops.md` `## Rules` is the last section
- [ ] `docs/agents.md` has no ci-dev section, model table updated
- [ ] `README.md` has no ci-dev row, count says 7
- [ ] `.claude-plugin/marketplace.json` description says 7 agents
- [ ] `grep -r "ci-dev" plugin/ docs/ README.md .claude-plugin/` returns no results
- [ ] `npm test` passes (no regressions)
- [ ] Merged agent passes agents-standards checklist
