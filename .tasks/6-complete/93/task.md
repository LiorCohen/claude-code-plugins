---
id: 93
title: Centralize sdd-settings ownership in project-settings skill
status: complete
created: 2026-02-07
completed: 2026-02-07
---

# Task 93: Centralize sdd-settings ownership in project-settings skill ✓

## Summary

Centralized all sdd-settings schema knowledge, validation rules, directory mappings, and settings structure into the `project-settings` skill. Removed inline duplication from 8 heavy-duplication files and standardized light references across 16+ additional files to defer to `project-settings` instead of duplicating schema details.

## Details

- Enhanced `project-settings` skill as the authoritative source with complete schema, minimal template, and "How to Reference" section
- De-duplicated `component-discovery` skill (removed 5 settings tables, replaced with skill reference)
- De-duplicated `sdd-settings` command (removed settings tables, "Settings vs Config" table, and validation rules)
- De-duplicated `helm-standards` and `helm-scaffolding` skills (replaced inline settings examples with references)
- De-duplicated `devops` agent (replaced inline settings YAML with skill references)
- De-duplicated `project-scaffolding` skill (replaced inline template with reference to project-settings)
- De-duplicated `sdd-init` command (replaced inline settings template with reference)
- De-duplicated `commit-standards` skill (replaced inline version location with reference)
- Standardized light references in agents (`backend-dev`, `frontend-dev`, `api-designer`, `tester`)
- Standardized light references in skills (`change-creation`, `planning`, `local-env`, scaffolding skills, testing skills)

## Acceptance Criteria

- [x] The `project-settings` skill owns the authoritative schema for `sdd-settings`
- [x] Skills, agents, and commands that reference settings defer to `project-settings` instead of duplicating schema/validation inline
- [x] Validation rules for settings are centralized in `project-settings`
- [x] Directory mappings related to settings are owned by `project-settings`
- [x] No remaining inline duplication of settings structure across skills, agents, or commands
