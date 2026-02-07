---
id: 95
title: Fix commands standards violations from audit report
priority: high
status: open
created: 2026-02-07
depends_on: []
blocks: []
---

# Task 95: Fix commands standards violations from audit report

## Description

Commands standards audit (2026-02-07) found violations across all 5 plugin commands. Key findings:

- **`sdd-change`** has highest drift risk (score 14, High tier) — 10 INVOKEs, 2 vague, long flows
- **3 of 5 commands** (`sdd-config`, `sdd-run`, `sdd-settings`) lack standard output formatting (`═══` boxes, `✓`/`✗`/`⚠` indicators, NEXT STEPS)
- **`sdd-init`** references non-existent "Phase 5" (only has Phases 0-4)
- **`sdd-settings`** H1 has extra "Command" suffix
- No commands have stale skill/agent references (all resolve)

See full audit report: `commands-audit-2026-02-07.md` in this task folder.

## Acceptance Criteria

- [ ] P1: Fix `sdd-init` Phase 5 reference → Phase 4
- [ ] P1: Fix `sdd-settings` H1 from `# /sdd-settings Command` to `# /sdd-settings`
- [ ] P1: Add NEXT STEPS sections to `sdd-config` operations
- [ ] P2: Add exact terminal output examples to `sdd-config` operations
- [ ] P2: Add terminal output examples to `sdd-run` operations
- [ ] P2: Document INVOKE return values in `sdd-change` (especially `planning` and agent invocations)
- [ ] P2: Clarify agent selection in `sdd-change implement` (which agent for which phase)
- [ ] P3: Convert `## Operations` to `## Actions` + `## Action: <name>` pattern in `sdd-config`, `sdd-run`, `sdd-settings`
- [ ] P3: Add `═══` box headers and status indicators to `sdd-config`, `sdd-run`, `sdd-settings`
- [ ] P3: Add error handling documentation for `sdd-config validate` and `sdd-run` operations
- [ ] P3: Document config generation overlap between `sdd-config generate` and `sdd-run env config`
- [ ] P4: Add NEXT STEPS to `sdd-settings`
- [ ] P4: Add arguments tables to `sdd-run`
