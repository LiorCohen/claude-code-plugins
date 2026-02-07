---
title: Merge ci-dev agent into devops agent
created: 2026-02-07
---

# Plan: Merge ci-dev agent into devops agent

## Problem Summary

The `ci-dev` and `devops` agents have significant overlap — both deal with Testkube, build pipelines, and deployment. Merging `ci-dev` into `devops` simplifies the agent roster and eliminates the unclear boundary between "infrastructure" and "CI/CD pipelines".

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/agents/devops.md` | Add CI/CD pipeline sections from ci-dev, update description, add `## Working Directory`, add `## Skills` section |
| `plugin/agents/ci-dev.md` | Delete |
| `docs/agents.md` | Remove ci-dev section, update devops section, update agent count and model table |
| `README.md` | Remove ci-dev row from agent table, update agent count |
| `plugin/skills/change-creation/SKILL.md` | No changes needed — ci-dev is not referenced here |
| `plugin/skills/planning/SKILL.md` | No changes needed — ci-dev is not referenced here |

## Changes

### 1. Merge ci-dev content into devops.md

Update the devops agent to absorb ci-dev responsibilities:

- **Description**: Add CI/CD pipelines, GitHub Actions, and PR checks to the description
- **Role statement**: Expand to include CI/CD expertise
- **Add `## Working Directory`**: `.github/workflows/` for CI/CD, plus existing infrastructure directories
- **Add `## Skills`**: Formalize the `postgresql` skill reference (fixes existing Task #91 violation)
- **Add CI/CD sections**: Pipeline Architecture (PR Check, Main Build, Deploy, Security Scan), Test Execution Strategy, Workflows to Maintain
- **Merge into Rules**: Add ci-dev rules (unit tests in CI, build once deploy many, ephemeral namespaces, cleanup after runs)
- **Update Responsibilities**: Add CI/CD pipeline items (maintain GitHub Actions workflows, configure PR checks)
- **Deduplicate**: Both agents mention Testkube — consolidate into the existing Testkube Setup section

### 2. Delete ci-dev.md

Remove `plugin/agents/ci-dev.md`.

### 3. Update docs/agents.md

- Remove the `### ci-dev` section
- Update `### devops` description to mention CI/CD
- Update the agent model table (remove ci-dev from Implementation row)
- Update agent count ("8 specialized agents" → "7 specialized agents" or similar)

### 4. Update README.md

- Remove the `ci-dev` row from the agent table
- Update "8 specialized agents" → "7 specialized agents"

### 5. No changes to changelogs

Changelogs are historical records — they should not be modified.

## Verification

- [ ] `plugin/agents/ci-dev.md` no longer exists
- [ ] `plugin/agents/devops.md` includes CI/CD pipeline content
- [ ] `devops.md` has `## Working Directory` section (fixes Task #91 violation)
- [ ] `devops.md` has `## Skills` section with `postgresql` reference (fixes Task #91 violation)
- [ ] `devops.md` has `## Rules` as the last section
- [ ] `grep -r "ci-dev" plugin/ docs/ README.md` returns no results (excluding changelogs and .tasks)
- [ ] Merged agent passes agents-standards checklist
