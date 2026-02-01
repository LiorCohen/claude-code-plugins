---
id: 68
title: Plans should focus on WHAT, not HOW
priority: high
status: implementing
created: 2026-02-01
depends_on: []
blocks: []
---

# Task 68: Plans should focus on WHAT, not HOW

## Description

Plans currently contain too much implementation detail. They should focus on **what** is changing, not **how** it is changing. Implementation details belong in specs, which should hold sufficient detail that plans don't need to include direct implementation guidance.

### Current Problem

- Plans include code snippets, specific function signatures, and step-by-step implementation instructions
- This creates duplication between plans and specs
- Plans become brittle when implementation details change
- The boundary between "planning" and "specification" is unclear

### Desired State

- **Plans** describe:
  - What files/components are affected
  - What behavior is changing
  - What the acceptance criteria are
  - Dependencies and sequencing between changes

- **Specs** describe:
  - How the implementation should work
  - Interfaces, types, and contracts
  - Implementation details and code patterns

## Acceptance Criteria

- [ ] Update SKILL.md plan template to remove implementation details
- [ ] Add guidance distinguishing plan vs spec responsibilities
- [ ] Update plan schema/template to focus on changes, not code
- [ ] Document that specs should be self-sufficient for implementation
