---
id: 59
title: Audit and update all agents for compatibility
priority: high
status: rejected
created: 2026-01-29
rejected_reason: "Obsolete — audit was completed, actionable findings tracked in #91"
---

# Task 59: Audit and update all agents for compatibility ✗

<!-- Original content preserved below -->

## Description

Agents are severely outdated and lacking depth. Need comprehensive review:
- Audit each agent in `plugin/agents/` one by one
- Update agent instructions to reflect recent changes (new directory structure, commands, workflows)
- Ensure agents are compatible with current plugin architecture
- Add depth where agents are too shallow or generic
- Verify agents reference correct paths (`changes/` not `specs/changes/`, etc.)
- Update any outdated tool usage patterns or assumptions
- Test each agent to ensure it works correctly with current plugin state

## Consolidated

- #34: Audit agent assumptions around interactivity
