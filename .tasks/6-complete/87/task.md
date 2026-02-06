---
id: 87
title: Reorganize component skills into colocated directory structure
priority: medium
status: complete
created: 2026-02-06
completed: 2026-02-06
depends_on: []
blocks: []
---

# Task 87: Reorganize component skills into colocated directory structure ✓

## Summary

Moved 15 component-type-specific skill directories under `plugin/skills/components/<type>/` for better organization and colocation. Updated all TypeScript path references, relative markdown links, template path documentation, and test file paths.

## Details

- Moved 15 skill directories into 9 component type groups under `plugin/skills/components/`
- Updated `project.ts` template path references
- Fixed cross-component relative markdown links
- Updated scaffolding SKILL.md template path documentation
- Updated 8 path constants across 5 test files
- Added build rules to CLAUDE.md to prevent direct `npx tsc` usage
- All tests passing (only pre-existing failures remain)
