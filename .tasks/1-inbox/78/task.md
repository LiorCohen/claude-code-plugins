---
id: 78
title: Fix sdd-init issues - node_modules, permissions, component names
priority: high
status: open
created: 2026-02-02
depends_on: []
blocks: []
---

# Task 78: Fix sdd-init issues - node_modules, permissions, component names

## Description

Three issues with the sdd-init experience:

1. **System node_modules not installed**: When the plugin is installed, the `plugin/system/` directory has dependencies (ajv, yaml) that aren't installed. The `dist/` folder is committed but imports from node_modules at runtime.

2. **Permission prompts for plugin reads**: Claude keeps asking for permissions when running sdd-init to read from the plugin's directory. The `recommended-permissions.json` only has Write/Edit/Bash patterns, no Read patterns for the plugin directory.

3. **Terrible default component names**: The default component names after sdd-init are generic like `task-api`, `task-server`, `task-dashboard` instead of being derived from the project name (e.g., `my-app-api`, `my-app-server`).

## Acceptance Criteria

- [ ] Document npm install requirement for plugin system dependencies in README and getting-started docs
- [ ] Add `Read(~/.claude/plugins/sdd/**)` to recommended-permissions.json
- [ ] Update PERMISSIONS.md to document the Read permission
- [ ] Update component-recommendation skill to require project-name-derived component names
- [ ] Update scaffolding skill examples to use project-name-based naming
- [ ] Update sdd-init command examples to show proper naming convention
