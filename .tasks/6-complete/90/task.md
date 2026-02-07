---
id: 90
title: Fix skills standards violations from audit report
priority: medium
status: complete
created: 2026-02-06
completed: 2026-02-07
depends_on: []
blocks: []
---

# Task 90: Fix skills standards violations from audit report ✓

## Summary

Fixed all three violation categories from the skills audit (#89):

- Moved 32 schema files (19 skills) from root to `schemas/` subdirectory
- Updated all 32 SKILL.md schema references to `schemas/` paths
- Removed 7 cross-skill file references across 5 skills
- Removed scaffolding template paths column and tree diagram
- Fixed 3 CLI-to-skill coupling violations
- Updated skills-standards consumer reference annotations

## Acceptance Criteria

- [x] All 19 skills' schema files moved from root to `schemas/` subdirectory
- [x] All SKILL.md schema references updated to `schemas/` paths
- [x] 7 cross-skill file references removed (contract-standards, database-standards, database-scaffolding, backend-standards, scaffolding)
- [x] 3 CLI-to-skill coupling violations fixed (scaffolding, domain-population, contract-scaffolding)
- [x] `npm run build:plugin` passes
- [x] `npm test` passes (pre-existing typescript-standards sync failure only)
