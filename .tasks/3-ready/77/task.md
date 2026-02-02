---
id: 77
title: sdd-new-change planning regression - filesystem issues
priority: high
status: planning
created: 2026-02-02
depends_on: []
blocks: []
---

# Task 77: sdd-new-change planning regression - filesystem issues

## Description

There is a severe regression in the planning workflow. The resulting filesystem structure is wrong after running sdd-new-change.

It appears that some functionality did not transfer correctly when external spec handling was migrated from sdd-init into sdd-new-change (see #65).

Need to audit the entire sdd-new-change workflow to identify what's broken and restore correct behavior.

## Investigation Areas

- Review the migration done in #65 (external spec handling move)
- Compare expected vs actual filesystem output after planning
- Trace the full sdd-new-change workflow end-to-end
- Identify which specific functionality is missing or broken

## Acceptance Criteria

- [ ] Root cause of the regression identified
- [ ] Document expected filesystem structure after sdd-new-change
- [ ] Fix all missing/broken functionality from the migration
- [ ] Verify correct filesystem output after planning
- [ ] Add tests to prevent future regressions
