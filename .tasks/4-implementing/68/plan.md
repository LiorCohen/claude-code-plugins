---
title: Plans should focus on WHAT, not HOW
created: 2026-02-01
updated: 2026-02-01
---

# Plan: Plans Should Focus on WHAT, not HOW

## Problem Summary

Plans contain too much implementation detail. They should describe the scope and shape of changes (WHAT), while specs contain implementation details (HOW). This applies to three different plan types in the codebase.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/tasks/SKILL.md` | Replace "Plan Schema" section with streamlined template |
| `plugin/skills/planning/SKILL.md` | Update SPEC vs PLAN table, revise phase templates, reinforce spec self-sufficiency |
| `docs/workflows.md` | Fix line 38: "How to build it" → "Execution phases and agent assignments" |

**No changes needed:**
- `plugin/skills/epic-planning/SKILL.md` - already focused on ordering/dependencies, not implementation

## Scope of Changes

### 1. Update Task-Level Plan Template (`.claude/skills/tasks/SKILL.md`)

**Current template (lines 182-214) includes:**
- "Implementation" section with phases
- Expectation of detailed steps

**New template will include:**
- **Problem Summary** - What problem this solves
- **Files to Modify** - What files are affected (table format)
- **Changes** - What behavioral/functional changes are being made
- **Dependencies** - What must happen before what
- **Tests** - Extensive list of tests to verify the changes work correctly
- **Verification** - What outcomes prove success (behavioral, not code-level)

### 2. Update Change-Level Plan Templates (`plugin/skills/planning/SKILL.md`)

**Current templates (lines 154-410) include task lists like:**
- "Implement domain logic"
- "Add data access layer"
- "Wire up controllers"
- "Create components"

These are HOW details that belong in the spec.

**Updated templates will:**
- Keep phase structure (Phase 1, Phase 2, etc.)
- Keep agent assignments
- Keep component references
- Replace task lists with outcome descriptions:
  - "Backend changes complete per SPEC.md" instead of "Implement domain logic, add data access layer..."
  - "Frontend changes complete per SPEC.md" instead of "Create components, add hooks..."
- Keep Deliverables section (what artifacts are produced)
- Add required **Tests** section with extensive test list (unit, integration, E2E)

### 3. Clarify SPEC vs PLAN Responsibilities

Update the table at lines 18-21 of `plugin/skills/planning/SKILL.md`:

| File | Purpose | Contains | Does NOT Contain |
|------|---------|----------|------------------|
| **SPEC.md** | What to build and how | Requirements, design, API contracts, implementation details, test cases | Execution order, agent assignments |
| **PLAN.md** | Execution coordination | Phases, agent assignments, dependencies, expected files, progress tracking | Implementation details, code patterns, specific tasks |

### 4. Add "Appropriate Detail" Guidance

Add a new section to `plugin/skills/planning/SKILL.md` clarifying:

**Acceptable in plans:**
- Brief code snippets as constraints or guidelines (e.g., "interface must include X field")
- High-level examples showing intent
- File paths and component names
- Phase sequencing and dependencies

**Not appropriate in plans:**
- Full implementations or complete code blocks
- Step-by-step coding instructions
- Line-by-line change lists
- Algorithm implementations (belong in spec)

### 5. Reinforce Spec Self-Sufficiency

The existing text in `planning/SKILL.md` says specs must be "self-sufficient" but this needs to be strengthened in context of plans being lighter.

Add explicit statement after the SPEC vs PLAN table:

> **Key principle:** Because plans focus on execution coordination (not implementation details), the SPEC.md must be comprehensive enough that an implementer can complete each phase by reading only the spec. Plans reference specs; they don't duplicate them.

### 6. Update docs/workflows.md

Line 38 currently says:
```
- `PLAN.md` - How to build it (phased implementation)
```

Change to:
```
- `PLAN.md` - Execution phases and agent coordination
```

This aligns with the principle that "how to build it" belongs in the spec.

### 7. Require Extensive Test Lists in Plans

Plans must include a **Tests** section with an extensive list of tests. This is critical because:
- Tests define the expected behavior (WHAT), not implementation (HOW)
- Tests serve as acceptance criteria verification
- Tests can be written/reviewed before implementation begins

The Tests section should list:
- Unit tests for each affected component
- Integration tests for component interactions
- E2E tests for user-facing flows
- Edge cases and error scenarios

Example format:
```markdown
## Tests

### Unit Tests
- [ ] `test_user_can_login_with_valid_credentials`
- [ ] `test_login_fails_with_invalid_password`
- [ ] `test_login_rate_limiting_after_5_failures`

### Integration Tests
- [ ] `test_auth_service_creates_session_in_database`
- [ ] `test_session_token_is_returned_in_response`

### E2E Tests
- [ ] `test_user_login_flow_redirects_to_dashboard`
```

### 8. Update Phase Template Structure

Current phase structure:
```
### Phase N: [Name]
**Agent:** `agent-name`
**Component:** component

Tasks:
- [ ] Specific implementation task 1
- [ ] Specific implementation task 2

Deliverables:
- Artifact 1
- Artifact 2
```

New phase structure:
```
### Phase N: [Name]
**Agent:** `agent-name`
**Component:** component

**Outcome:** [What state the system is in after this phase]

**Deliverables:**
- Artifact 1
- Artifact 2
```

## Dependencies

None - this is a documentation change.

## Verification

- [ ] Task-level plan template in `.claude/skills/tasks/SKILL.md` updated
- [ ] Change-level plan templates in `plugin/skills/planning/SKILL.md` updated
- [ ] SPEC vs PLAN table includes "Does NOT Contain" column
- [ ] "Appropriate Detail" guidance section added
- [ ] Spec self-sufficiency statement added after SPEC vs PLAN table
- [ ] Phase templates use "Outcome" instead of "Tasks" lists
- [ ] Plan templates require extensive **Tests** section
- [ ] `docs/workflows.md` line 38 updated (no "How to build it")
- [ ] New plans created using templates contain no implementation task lists
