---
id: 96
title: Fix sdd-init Phase 1 — plugin verification first, tool checks via system CLI
priority: high
status: complete
created: 2026-02-07
completed: 2026-02-07
---

# Task 96: Fix sdd-init Phase 1 — plugin verification first, tool checks via system CLI ✓

## Summary

Added `sdd-system env check-tools` CLI command and restructured sdd-init's environment verification phases.

## Details

- Added new `env check-tools` CLI action with structured JSON output (platform, package manager, tool status, install hints)
- Registered in env namespace and CLI help text
- Restructured sdd-init.md: renumbered phases 0–4 to 1–5, plugin verification first (hard blocker), tool checks via CLI, .claude/settings.json verification
- Removed redundant sections: "Available Component Types", "Important Notes", "Non-Destructive Behavior", duplicate "NOT done during init" lists
- Added 40 unit tests for the check-tools command
- Version bump: 6.2.4 → 6.3.0
