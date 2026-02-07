---
id: 93
title: Centralize sdd-settings ownership in project-settings skill
status: planning
created: 2026-02-07
---

# Task 93: Centralize sdd-settings ownership in project-settings skill

## Description

Many skills, agents, and commands duplicate schema knowledge, validation rules, directory mappings, and settings structure inline instead of deferring to the project-settings skill as the single authority. All matters related to project settings (sdd-settings, the sdd-settings commands, system CLI related commands, etc.) should be owned and centralized in the project-settings skill. It should have an authoritative schema for sdd-settings and should handle all matters related to this.

## Acceptance Criteria

- [ ] The `project-settings` skill owns the authoritative schema for `sdd-settings`
- [ ] Skills, agents, and commands that reference settings defer to `project-settings` instead of duplicating schema/validation inline
- [ ] Validation rules for settings are centralized in `project-settings`
- [ ] Directory mappings related to settings are owned by `project-settings`
- [ ] No remaining inline duplication of settings structure across skills, agents, or commands
