---
id: 64
title: Refactor planning system architecture
priority: high
status: complete
created: 2026-01-31
completed: 2026-01-31
depends_on: []
blocks: []
---

# Task 64: Refactor planning system architecture ✓

## Summary

Major refactor of the planning system architecture establishing clear separation between skills (interactive planning) and agents (non-interactive execution). Removed `planner` and `spec-writer` agents, merging their responsibilities into `change-creation` skill. SPEC.md is now a thorough technical specification with domain updates and testing strategy defined upfront. PLAN.md focuses on execution with implementation state tracking for session resumption and resource usage tracking.

## Description

Comprehensive refactor of the planning system to establish clear boundaries between interactive planning (skills) and non-interactive execution (agents).

## Key Decisions

### 1. Skills vs Agents Separation

| Context | Responsibility |
|---------|----------------|
| **Skills** (main context) | All planning, spec creation, domain docs - interactive, needs user input |
| **Agents** (subagent) | Execution only - non-interactive, implements approved plans |

### 2. Agent Consolidation

- **Remove `planner` agent** - merge into `change-creation` skill
- **Remove `spec-writer` agent** - merge into `change-creation` skill

### 3. Domain Documentation Timing

- Done **during planning**, not implementation
- Plan specifies **exactly** what domain doc changes will happen (glossary terms, definitions, etc.)
- Implementation just executes the specified changes

### 4. Dynamic Phases from sdd-settings.yaml

Instead of fixed templates, phases are generated based on:
1. Read `sdd-settings.yaml` to get project components
2. Determine which components are affected by the change
3. Generate phases in dependency order
4. Assign agents contextually based on (component + nature of change)

### 5. Component Dependency Graph

```
config ──────┐
             │
contract ────┼──→ server (includes DB) ──→ helm
             │           │
             │           ↓
             └───────→ webapp
```

- `server` depends on: config, contract
- `webapp` depends on: contract, server
- `helm` depends on: server
- `database` is handled by backend-dev as part of server phase (not separate)

### 6. Contextual Agent Assignment

Agent assignment based on (component + nature of change), not just component type:

| Config change for | Agent |
|-------------------|-------|
| Backend services | backend-dev |
| Frontend app | frontend-dev |
| Deployment/infra | devops |

### 7. Testing Split

| Test Type | When | Who |
|-----------|------|-----|
| Unit tests | During implementation (TDD) | backend-dev, frontend-dev |
| Integration & E2E | After implementation | tester |

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/agents/planner.md` | Remove (merge into change-creation) |
| `plugin/agents/spec-writer.md` | Remove (merge into change-creation) |
| `plugin/skills/change-creation/SKILL.md` | Major refactor - absorb planner/spec-writer, dynamic phase generation |
| `plugin/skills/planning/SKILL.md` | Update templates - remove Phase 0, make dynamic |
| `plugin/commands/sdd-implement-change.md` | Simplify - remove Phase 0 logic |
| `plugin/commands/sdd-new-change.md` | Update to use refactored change-creation |

## Acceptance Criteria

- [ ] `planner` agent removed, responsibilities in `change-creation` skill
- [ ] `spec-writer` agent removed, responsibilities in `change-creation` skill
- [ ] Domain documentation specified in plan, not figured out during implementation
- [ ] Phases dynamically generated from `sdd-settings.yaml`
- [ ] Component dependency graph enforced in phase ordering
- [ ] Agent assignment is contextual (component + change nature)
- [ ] Unit tests remain TDD in implementation phases
- [ ] Integration/E2E testing is separate phase after implementation

## Consolidated

- #15: Planner is too rigid and template-driven
