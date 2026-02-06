---
id: 89
title: Skills standards audit report — 2026-02-06
priority: medium
status: open
created: 2026-02-06
depends_on: []
blocks: [27]
---

# Task 89: Skills standards audit report — 2026-02-06

## Description

Full audit of all 35 plugin skills against the skills-standards checklist. The audit report is attached as `report.md` in this task folder.

## Key Findings

- **Input/Output schemas:** 0/35 skills pass (systemic — no schema files exist)
- **Code blocks:** 3/35 pass (systemic — ~106 unlanguaged code blocks)
- **Self-containment:** 15/35 pass (vague cross-references, broken links)
- **Frontmatter:** 34/35 pass (1 description references callers)
- **3 broken cross-references** to non-existent skills
- **6 informational cycles** in dependency graph
- **Total plugin skill budget: ~96K tokens** (`change-creation` alone is 8.7%)

## Acceptance Criteria

- [ ] All 9 recommended fix priorities addressed (see report)
- [ ] Re-audit passes with improved scores
