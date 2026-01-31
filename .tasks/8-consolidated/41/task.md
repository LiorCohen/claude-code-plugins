---
id: 41
title: sdd-new-change should handle external specs
priority: inbox
status: consolidated
created: 2026-01-25
consolidated_into: 65
---

# Task 41: sdd-new-change should handle external specs → consolidated into #65

## Description

`sdd-new-change` currently doesn't support external specs the way `sdd-init` does. Need to:
- Accept an external spec as input for creating a new change
- Apply the same external spec handling rules (archive/reference only, create self-sufficient specs)
- Consistent behavior between `sdd-init` and `sdd-new-change` for external spec workflows
