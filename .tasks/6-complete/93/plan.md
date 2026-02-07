---
title: Centralize sdd-settings ownership in project-settings skill
created: 2026-02-07
---

# Plan: Centralize sdd-settings ownership in project-settings skill

## Problem Summary

The sdd-settings schema, validation rules, component settings tables, and directory mappings are duplicated across 20+ files. When the schema changes, every file with inline duplication must be updated manually. The `project-settings` skill should be the single authoritative source, with all other files referencing it.

## Audit of Current Duplication

### Heavy duplication (full or partial schema inlined):

| File | What's duplicated |
|------|-------------------|
| `plugin/skills/component-discovery/SKILL.md` | ALL 5 component settings tables + validation rules (Step 5) |
| `plugin/commands/sdd-settings.md` | ALL 5 component settings tables + Settings vs Config table + validation rules |
| `plugin/skills/components/helm/helm-standards/SKILL.md` | Helm settings schema with YAML examples |
| `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | Helm settings schema with YAML examples |
| `plugin/agents/devops.md` | Partial settings schema (helm chart pattern YAML, settings to check) |
| `plugin/skills/project-scaffolding/SKILL.md` | Full sdd-settings.yaml template |
| `plugin/commands/sdd-init.md` | Full sdd-settings.yaml format template |
| `plugin/skills/commit-standards/SKILL.md` | Version field location in sdd-settings.yaml |

### Light references (just "check sdd-settings.yaml for X"):

| File | Reference type |
|------|---------------|
| `plugin/agents/backend-dev.md` | "check for server names" + "check for contract package name" |
| `plugin/agents/frontend-dev.md` | "check for webapp component names" |
| `plugin/agents/api-designer.md` | "check for contract package names" |
| `plugin/agents/tester.md` | "check for testing component paths" |
| `plugin/skills/change-creation/SKILL.md` | Reads components from settings for phase generation |
| `plugin/skills/planning/SKILL.md` | References settings for existing component details |
| `plugin/skills/local-env/SKILL.md` | Deploy reads settings for namespace/components |
| `plugin/commands/sdd-change.md` | Passes `existing_components` and `default_domain` from settings |
| `plugin/commands/sdd-run.md` | Namespace from settings |
| `plugin/skills/components/config/config-scaffolding/SKILL.md` | "settings defined in sdd-settings" |
| `plugin/skills/components/backend/backend-scaffolding/SKILL.md` | "settings defined in sdd-settings" |
| `plugin/skills/components/database/database-scaffolding/SKILL.md` | "component name in sdd-settings" |
| `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | "component name in sdd-settings" |
| `plugin/skills/components/e2e-testing/e2e-testing/SKILL.md` | "testing component defined in sdd-settings" |
| `plugin/skills/components/integration-testing/integration-testing/SKILL.md` | "testing component defined in sdd-settings" |

## Changes

### 1. Enhance project-settings skill as the authoritative source

Add to `plugin/skills/project-settings/SKILL.md`:

- An "Authoritative Source" declaration at the top stating this skill is the single source of truth for all sdd-settings matters
- A `version` field to the schema (currently only documented in commit-standards)
- A "Minimal Template" section with the initial sdd-settings.yaml template (currently only in project-scaffolding)
- A "How to Reference" section explaining that other skills/agents/commands should reference this skill rather than duplicating schema details

### 2. De-duplicate component-discovery skill

In `plugin/skills/component-discovery/SKILL.md`:

- Remove the 5 duplicated "Component Settings" tables (Server, Webapp, Helm, Database, Contract)
- Remove "Step 5: Settings Validation" rules
- Replace with a skill reference: delegate to `project-settings` for settings schema, defaults, and validation
- Keep the discovery questions and workflow (that's this skill's unique value)
- Keep the examples (they show discovery output, not schema definitions)

### 3. De-duplicate sdd-settings command

In `plugin/commands/sdd-settings.md`:

- Remove the 5 duplicated "Settings by Component Type" tables
- Remove the "Settings vs Config" table
- Remove the "Validation Rules" section
- Replace each with a reference to the `project-settings` skill
- Keep usage examples, operations, workflow steps (the command's unique value)

### 4. De-duplicate helm-standards skill

In `plugin/skills/components/helm/helm-standards/SKILL.md`:

- Remove the inline sdd-settings.yaml helm example block at the top
- Remove the "Chart-per-Server Pattern" YAML examples that duplicate settings structure
- Remove the "Settings Impact on Chart Structure" table
- Replace with a reference to the `project-settings` skill for helm component settings
- Keep all Helm-specific standards (values, templates, observability, config injection)

### 5. De-duplicate helm-scaffolding skill

In `plugin/skills/components/helm/helm-scaffolding/SKILL.md`:

- Remove the inline settings YAML examples
- Remove the "Settings Impact on Scaffolding" tables
- Replace with a reference to the `project-settings` skill
- Keep all scaffolding-specific content (what files to create, templates)

### 6. De-duplicate devops agent

In `plugin/agents/devops.md`:

- Remove the "Settings-Driven Infrastructure" section's inline YAML examples of settings
- Remove the "Helm Chart Pattern" YAML examples duplicating settings structure
- Replace with a reference to the `project-settings` skill for settings schema
- Keep the agent's responsibilities, rules, and workflow guidance

### 7. De-duplicate project-scaffolding skill

In `plugin/skills/project-scaffolding/SKILL.md`:

- Remove the "Minimal sdd-settings.yaml Template" (will be in project-settings skill)
- Replace with a reference to the `project-settings` skill for the template
- Keep all other scaffolding content (directory structure, modes, .gitignore)

### 8. De-duplicate sdd-init command

In `plugin/commands/sdd-init.md`:

- Remove the inline "sdd-settings.yaml format" block
- Replace with a reference to the `project-settings` skill for the template
- Keep the Phase workflow, environment checks, and completion message

### 9. De-duplicate commit-standards skill

In `plugin/skills/commit-standards/SKILL.md`:

- Remove the inline "Project Version Location" section showing the version field
- Replace with a reference to the `project-settings` skill
- Keep all other commit standards

### 10. Standardize light references in agents

In `backend-dev.md`, `frontend-dev.md`, `api-designer.md`, `tester.md`:

- Add a skill reference line: `- project-settings — Settings schema, component types, and directory mappings`
- Change bare "check `.sdd/sdd-settings.yaml`" references to "refer to the `project-settings` skill"

### 11. Standardize light references in skills

In `change-creation`, `planning`, `local-env`, scaffolding skills, and testing skills:

- Add skill reference to `project-settings` where settings are read
- Change bare file references to skill references

## Dependencies

- Changes 2-11 all depend on Change 1 (enhancing the authoritative source)
- Changes 2-11 are independent of each other

## Tests

No automated tests needed — these are documentation-only changes to `.md` files.

### Manual Verification
- [ ] `grep -r "sdd-settings" plugin/ --include="*.md"` shows no remaining inline settings tables
- [ ] Every file that references sdd-settings either references the project-settings skill or just reads the file for values
- [ ] The project-settings skill contains the complete authoritative schema
- [ ] No component settings tables are duplicated outside project-settings

## Verification

- [ ] All sdd-settings schema knowledge is centralized in the project-settings skill
- [ ] Files that previously duplicated schema now reference the skill instead
- [ ] The project-settings skill is comprehensive enough to be the sole reference
- [ ] Light references in agents/skills point to the skill, not just the raw file
