---
id: 90
title: Fix skills standards violations from audit report
priority: medium
status: ready
created: 2026-02-06
depends_on: []
blocks: []
---

# Task 90: Fix skills standards violations from audit report

## Description

Fix all violations identified in the audit report (`report.md` in this task folder). Three categories: schema files at root level instead of `schemas/` subdirectory (19 skills), cross-skill file references (5 skills, 7 violations), and CLI-to-skill invocation documentation (3 skills).

## Acceptance Criteria

- [ ] All 19 skills' schema files moved from root to `schemas/` subdirectory
- [ ] All SKILL.md schema references updated to `schemas/` paths
- [ ] 7 cross-skill file references removed (contract-standards, database-standards, database-scaffolding, backend-standards, scaffolding)
- [ ] 3 CLI-to-skill coupling violations fixed (scaffolding, domain-population, contract-scaffolding)
- [ ] `npm run build:plugin` passes
- [ ] `npm test` passes
