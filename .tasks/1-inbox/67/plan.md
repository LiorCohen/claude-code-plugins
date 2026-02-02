---
title: Store user instructions in plans, specs, and .sdd/
created: 2026-02-02
updated: 2026-02-02
---

# Plan: Store User Instructions in Plans, Specs, and .sdd/

## Problem Summary

User feedback and instructions are currently lost between sessions. There's no persistent location to capture:
- Project-wide preferences and constraints
- Change-specific user requirements
- Task-specific user guidance

This causes:
- Repeated clarifications across sessions
- Inconsistent implementations that don't reflect user preferences
- Lost context when different agents work on the same project

## Solution Overview

Create a three-level instruction hierarchy:

1. **Global** (`.sdd/instructions.md`) - Project-wide preferences that apply to all work
2. **Plan-level** (task and change plans) - User guidance specific to a work item
3. **Spec-level** (SPEC.md files) - User requirements that become acceptance criteria

---

## Files to Create

| File | Purpose |
|------|---------|
| `.sdd/instructions.md` | Global user instructions template |

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/skills/planning/SKILL.md` | Add guidance for reading/writing user instructions in plans |
| `plugin/skills/spec-writing/SKILL.md` | Add "User Requirements and Constraints" section to spec template |
| `plugin/skills/project-settings/SKILL.md` | Document `.sdd/instructions.md` location and format |
| `.claude/skills/tasks/SKILL.md` | Add "User Guidance" section to task plan template |
| `CONTRIBUTING.md` | Document instruction storage conventions |

---

## Phase 1: Create Global Instructions File

**Outcome:** `.sdd/instructions.md` exists with documented format for storing project-wide user preferences.

**Deliverables:**
- `.sdd/instructions.md` template with clear section headers
- Sections for: Architecture, Testing, Observability, Performance, Database, Team Norms
- Instructional comments explaining what goes in each section

---

## Phase 2: Update Planning Skill

**Outcome:** Planning workflow captures user feedback and references global instructions.

**Deliverables:**
- `plugin/skills/planning/SKILL.md` updated with:
  - Instruction to read `.sdd/instructions.md` when creating plans
  - "User Guidance" section template for change-level plans
  - Guidance on what belongs in plan-level vs global instructions

---

## Phase 3: Update Spec Writing Skill

**Outcome:** Specs include user requirements as first-class acceptance criteria.

**Deliverables:**
- `plugin/skills/spec-writing/SKILL.md` updated with:
  - "User Requirements and Constraints" section in spec template (after Overview)
  - Examples of user requirements vs implementation details
  - Link pattern for referencing `.sdd/instructions.md`

---

## Phase 4: Update Task Management Skill

**Outcome:** Task-level plans include user guidance section.

**Deliverables:**
- `.claude/skills/tasks/SKILL.md` updated with:
  - "User Guidance" section template for task plans
  - Guidance on capturing user feedback during task work

---

## Phase 5: Update Project Settings Skill

**Outcome:** Project settings skill documents the `.sdd/` structure including instructions.

**Deliverables:**
- `plugin/skills/project-settings/SKILL.md` updated with:
  - Documentation of `.sdd/instructions.md` purpose and location
  - When to use global instructions vs plan/spec-level instructions

---

## Phase 6: Document Conventions

**Outcome:** CONTRIBUTING.md documents how to provide and store user instructions.

**Deliverables:**
- `CONTRIBUTING.md` updated with:
  - Section explaining the instruction hierarchy (global → plan → spec)
  - Examples of what goes at each level
  - How instructions flow into implementation

---

## Dependencies

- None (builds on existing `.sdd/` directory from task #50)

## Testing Strategy

- Manual verification: Create a new change and verify all instruction touchpoints work
- Verify skills correctly reference instructions when generating plans/specs

## Verification Checklist

- [ ] `.sdd/instructions.md` exists with clear format
- [ ] `planning/SKILL.md` references global instructions
- [ ] `spec-writing/SKILL.md` includes User Requirements section in template
- [ ] `tasks/SKILL.md` includes User Guidance section in plan template
- [ ] `project-settings/SKILL.md` documents `.sdd/instructions.md`
- [ ] `CONTRIBUTING.md` documents instruction conventions
